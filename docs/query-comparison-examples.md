# Firebase vs 관계형 DB 쿼리 비교 예시

## 실제 사용 시나리오별 비교

---

## 시나리오 1: 특정 워크스페이스의 프로젝트별 거래 내역 조회

### 요구사항
- 워크스페이스 ID: 1
- 프로젝트 ID: "PROJ-001"
- 카테고리: "식비"
- 기간: 2024-01-01 ~ 2024-12-31
- 프로젝트명도 함께 표시

### 🔥 Firebase (Firestore)

```javascript
// 문제점: JOIN이 불가능하여 여러 번 쿼리 필요

// 1단계: 프로젝트 정보 가져오기
const projectDoc = await db.collection('projects')
  .doc('PROJ-001')
  .get();
const projectName = projectDoc.data().name;

// 2단계: 거래 내역 가져오기 (복합 필터는 인덱스 필요)
const transactionsQuery = db.collection('transactions')
  .where('workspace_id', '==', 1)
  .where('project_id', '==', 'PROJ-001')
  .where('category', '==', '식비')
  .where('transaction_date', '>=', '2024-01-01')
  .where('transaction_date', '<=', '2024-12-31')
  .orderBy('transaction_date', 'desc')
  .limit(20);

const transactionsSnapshot = await transactionsQuery.get();

// 3단계: 데이터 가공
const transactions = transactionsSnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
  project_name: projectName // 수동으로 추가
}));

// ⚠️ 문제점:
// - 최소 2번의 쿼리 (프로젝트 + 거래)
// - 복합 인덱스 필요 (workspace_id + project_id + category + transaction_date)
// - 인덱스가 많아질수록 비용 증가
// - 데이터가 많아지면 느려짐
```

**읽기 횟수**: 1 (프로젝트) + N (거래) = **N+1번**

---

### 🗄️ 관계형 DB (SQL)

```sql
-- 한 번의 쿼리로 모든 데이터 조회
SELECT 
  t.id,
  t.workspace_id,
  t.project_id,
  t.category,
  t.deposit_amount,
  t.withdrawal_amount,
  t.transaction_date,
  t.memo,
  p.name as project_name,
  w.name as workspace_name
FROM transactions t
JOIN projects p ON t.project_id = p.id
JOIN workspaces w ON t.workspace_id = w.id
WHERE t.workspace_id = 1
  AND t.project_id = 'PROJ-001'
  AND t.category = '식비'
  AND t.transaction_date BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY t.transaction_date DESC
LIMIT 20;

-- ⚠️ 장점:
-- - 1번의 쿼리로 모든 데이터 조회
-- - 인덱스 활용으로 매우 빠름
-- - JOIN으로 관련 데이터 자동 연결
```

**읽기 횟수**: **1번**

---

## 시나리오 2: 월별 입출금 집계

### 요구사항
- 워크스페이스 ID: 1
- 2024년 월별 입금/출금 합계

### 🔥 Firebase (Firestore)

```javascript
// 문제점: 집계를 클라이언트에서 해야 함

// 1단계: 모든 거래 내역 가져오기
const transactionsQuery = db.collection('transactions')
  .where('workspace_id', '==', 1)
  .where('transaction_date', '>=', '2024-01-01')
  .where('transaction_date', '<=', '2024-12-31');

const transactionsSnapshot = await transactionsQuery.get();

// 2단계: 클라이언트에서 집계 계산
const monthlyStats = {};
transactionsSnapshot.docs.forEach(doc => {
  const data = doc.data();
  const month = data.transaction_date.substring(0, 7); // YYYY-MM
  
  if (!monthlyStats[month]) {
    monthlyStats[month] = {
      deposit: 0,
      withdrawal: 0
    };
  }
  
  monthlyStats[month].deposit += data.deposit_amount || 0;
  monthlyStats[month].withdrawal += data.withdrawal_amount || 0;
});

// ⚠️ 문제점:
// - 모든 데이터를 가져와야 함 (10,000건이면 10,000건 모두)
// - 클라이언트에서 계산 → 느림
// - 메모리 사용량 증가
// - 읽기 비용 증가
```

**읽기 횟수**: **모든 거래 내역 (예: 10,000건)**

---

### 🗄️ 관계형 DB (SQL)

```sql
-- DB에서 직접 집계 계산
SELECT 
  DATE_FORMAT(transaction_date, '%Y-%m') as month,
  SUM(deposit_amount) as total_deposit,
  SUM(withdrawal_amount) as total_withdrawal,
  COUNT(*) as transaction_count
FROM transactions
WHERE workspace_id = 1
  AND transaction_date BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
ORDER BY month;

-- ⚠️ 장점:
-- - DB에서 직접 계산 → 매우 빠름
-- - 결과만 가져옴 (12개 행)
-- - 인덱스 활용
-- - 메모리 효율적
```

**읽기 횟수**: **결과 행 수만큼 (예: 12개)**

---

## 시나리오 3: 프로젝트별 총액과 거래 건수

### 요구사항
- 워크스페이스 ID: 1
- 각 프로젝트별 입금/출금 합계와 거래 건수

### 🔥 Firebase (Firestore)

```javascript
// 문제점: 여러 번의 쿼리와 클라이언트 계산

// 1단계: 프로젝트 목록 가져오기
const projectsSnapshot = await db.collection('projects')
  .where('workspace_id', '==', 1)
  .get();

// 2단계: 각 프로젝트별로 거래 내역 조회
const projectStats = await Promise.all(
  projectsSnapshot.docs.map(async (projectDoc) => {
    const projectId = projectDoc.id;
    
    // 각 프로젝트마다 쿼리 실행
    const transactionsSnapshot = await db.collection('transactions')
      .where('workspace_id', '==', 1)
      .where('project_id', '==', projectId)
      .get();
    
    // 클라이언트에서 집계
    let totalDeposit = 0;
    let totalWithdrawal = 0;
    
    transactionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalDeposit += data.deposit_amount || 0;
      totalWithdrawal += data.withdrawal_amount || 0;
    });
    
    return {
      project_id: projectId,
      project_name: projectDoc.data().name,
      total_deposit: totalDeposit,
      total_withdrawal: totalWithdrawal,
      count: transactionsSnapshot.size
    };
  })
);

// ⚠️ 문제점:
// - N+1 쿼리 문제 (프로젝트 수만큼 추가 쿼리)
// - 프로젝트가 10개면 11번의 쿼리
// - 클라이언트에서 집계 계산
// - 매우 느림
```

**읽기 횟수**: 1 (프로젝트) + N (프로젝트별 거래) = **N+1번**

---

### 🗄️ 관계형 DB (SQL)

```sql
-- 한 번의 쿼리로 모든 집계 계산
SELECT 
  p.id as project_id,
  p.name as project_name,
  COALESCE(SUM(t.deposit_amount), 0) as total_deposit,
  COALESCE(SUM(t.withdrawal_amount), 0) as total_withdrawal,
  COUNT(t.id) as transaction_count
FROM projects p
LEFT JOIN transactions t ON p.id = t.project_id AND t.workspace_id = 1
WHERE p.workspace_id = 1
GROUP BY p.id, p.name
ORDER BY p.name;

-- ⚠️ 장점:
-- - 1번의 쿼리로 모든 프로젝트 통계 계산
-- - DB에서 집계 → 매우 빠름
-- - JOIN으로 효율적 처리
-- - 거래가 없는 프로젝트도 표시 (LEFT JOIN)
```

**읽기 횟수**: **1번**

---

## 시나리오 4: 카테고리별 통계 (Top 10)

### 요구사항
- 워크스페이스 ID: 1
- 2024년 카테고리별 총 출금액 Top 10

### 🔥 Firebase (Firestore)

```javascript
// 문제점: 모든 데이터를 가져와서 정렬해야 함

// 1단계: 모든 거래 내역 가져오기
const transactionsSnapshot = await db.collection('transactions')
  .where('workspace_id', '==', 1)
  .where('transaction_date', '>=', '2024-01-01')
  .where('transaction_date', '<=', '2024-12-31')
  .get();

// 2단계: 클라이언트에서 집계 및 정렬
const categoryStats = {};
transactionsSnapshot.docs.forEach(doc => {
  const data = doc.data();
  const category = data.category;
  
  if (!categoryStats[category]) {
    categoryStats[category] = 0;
  }
  
  categoryStats[category] += data.withdrawal_amount || 0;
});

// 3단계: 정렬 및 Top 10 선택
const topCategories = Object.entries(categoryStats)
  .map(([category, total]) => ({ category, total }))
  .sort((a, b) => b.total - a.total)
  .slice(0, 10);

// ⚠️ 문제점:
// - 모든 데이터를 가져와야 함
// - 클라이언트에서 집계 및 정렬
// - 메모리 사용량 증가
```

**읽기 횟수**: **모든 거래 내역**

---

### 🗄️ 관계형 DB (SQL)

```sql
-- DB에서 집계, 정렬, LIMIT 처리
SELECT 
  category,
  SUM(withdrawal_amount) as total_withdrawal,
  COUNT(*) as transaction_count
FROM transactions
WHERE workspace_id = 1
  AND transaction_date BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY category
ORDER BY total_withdrawal DESC
LIMIT 10;

-- ⚠️ 장점:
-- - DB에서 모든 처리 (집계, 정렬, LIMIT)
-- - 결과만 가져옴 (10개 행)
-- - 매우 빠름
-- - 메모리 효율적
```

**읽기 횟수**: **10개 행만**

---

## 📊 성능 비교 요약

| 시나리오 | Firebase 읽기 횟수 | SQL 읽기 횟수 | 성능 차이 |
|---------|-------------------|--------------|----------|
| 복합 필터 + JOIN | N+1번 | 1번 | **N배 빠름** |
| 월별 집계 | 모든 행 (10,000) | 결과만 (12) | **833배 빠름** |
| 프로젝트별 통계 | N+1번 | 1번 | **N배 빠름** |
| 카테고리 Top 10 | 모든 행 (10,000) | 결과만 (10) | **1000배 빠름** |

---

## 💰 비용 비교 (Firebase 기준)

Firebase는 읽기 횟수에 따라 과금됩니다.

**예시:**
- 거래 내역 10,000건
- 월별 집계 조회 시:
  - Firebase: 10,000번 읽기 = **$0.06** (1회 조회당)
  - SQL: 12번 읽기 = **무료** (SQLite) 또는 **서버 비용만**

**데이터가 쌓일수록 Firebase 비용이 기하급수적으로 증가합니다.**

---

## 🎯 결론

이 프로젝트의 쿼리 패턴을 보면:
- ✅ 복잡한 필터링
- ✅ 집계 연산
- ✅ JOIN 필요
- ✅ 정렬 및 페이징

**관계형 DB가 압도적으로 효율적입니다.**

특히 데이터가 쌓일수록 그 차이는 더욱 커집니다.

---

**작성일**: 2025-11-28


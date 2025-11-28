# Firebase vs 관계형 DB 비교 분석

## 📊 프로젝트 특성 분석

### 현재 프로젝트의 주요 쿼리 패턴

1. **복합 필터링**
   - 워크스페이스 + 프로젝트 + 카테고리 + 날짜 범위
   - 예: "A회사의 프로젝트1에서 지난달 '식비' 카테고리 거래"

2. **집계 연산**
   - 월별 입출금 합계
   - 프로젝트별 총액
   - 카테고리별 통계

3. **JOIN 연산**
   - 거래 내역 + 프로젝트 정보
   - 거래 내역 + 증빙서류
   - 워크스페이스 + 프로젝트 목록

4. **정렬 및 페이징**
   - 날짜순, 금액순 정렬
   - 페이지네이션

---

## 🔥 Firebase (Firestore) 분석

### 장점
✅ **실시간 동기화**
- 여러 클라이언트 간 자동 동기화
- 오프라인 지원

✅ **서버리스**
- 인프라 관리 불필요
- 자동 스케일링

✅ **NoSQL 유연성**
- 스키마 변경이 쉬움

### 단점 (이 프로젝트에서)
❌ **복잡한 필터링의 한계**
```javascript
// Firebase: 여러 필터를 동시에 사용하기 어려움
// 예: 워크스페이스 + 프로젝트 + 카테고리 + 날짜 범위
db.collection('transactions')
  .where('workspace_id', '==', workspaceId)
  .where('project_id', '==', projectId)
  .where('category', '==', category)
  .where('transaction_date', '>=', startDate)
  .where('transaction_date', '<=', endDate)
  // ⚠️ 인덱스가 복잡해지고, 쿼리 제한이 많음
```

❌ **클라이언트 측 필터링 필요**
```javascript
// 데이터가 많아질수록 비효율적
const allTransactions = await db.collection('transactions').get();
const filtered = allTransactions.docs
  .filter(doc => doc.data().workspace_id === workspaceId)
  .filter(doc => doc.data().category === '식비')
  .filter(doc => doc.data().transaction_date >= startDate);
// ⚠️ 모든 데이터를 가져온 후 필터링 → 비효율
```

❌ **집계 연산의 한계**
- SUM, COUNT, AVG 등을 클라이언트에서 계산
- 데이터가 많아질수록 느려짐

❌ **JOIN 불가능**
- 프로젝트 정보를 가져오려면 별도 쿼리
- N+1 쿼리 문제 발생 가능

❌ **비용 증가**
- 읽기 횟수에 따라 과금
- 필터링을 위해 많은 읽기가 필요

---

## 🗄️ 관계형 DB (SQLite/PostgreSQL) 분석

### 장점 (이 프로젝트에 적합)
✅ **효율적인 복합 쿼리**
```sql
-- 한 번의 쿼리로 모든 필터링과 JOIN 처리
SELECT 
  t.*,
  p.name as project_name,
  w.name as workspace_name
FROM transactions t
JOIN projects p ON t.project_id = p.id
JOIN workspaces w ON t.workspace_id = w.id
WHERE t.workspace_id = ?
  AND t.project_id = ?
  AND t.category = ?
  AND t.transaction_date BETWEEN ? AND ?
ORDER BY t.transaction_date DESC
LIMIT 20 OFFSET 0;
-- ⚠️ 인덱스 활용으로 매우 빠름
```

✅ **서버 측 집계**
```sql
-- DB에서 직접 계산, 빠르고 효율적
SELECT 
  category,
  SUM(deposit_amount) as total_deposit,
  SUM(withdrawal_amount) as total_withdrawal,
  COUNT(*) as count
FROM transactions
WHERE workspace_id = ? 
  AND transaction_date BETWEEN ? AND ?
GROUP BY category;
```

✅ **인덱스 최적화**
- 복합 인덱스로 쿼리 성능 향상
- 데이터가 많아져도 빠른 검색

✅ **데이터 무결성**
- 외래키 제약조건
- 트랜잭션 지원

✅ **비용 효율적**
- SQLite: 무료, 파일 기반
- PostgreSQL: 서버 비용만 (읽기 횟수 제한 없음)

### 단점
❌ **실시간 동기화 없음**
- 폴링 또는 WebSocket 필요

❌ **인프라 관리 필요** (PostgreSQL의 경우)
- SQLite는 파일 기반이라 간단

---

## 📈 성능 비교 (예상)

### 시나리오: 10,000건의 거래 데이터에서 필터링

| 작업 | Firebase | 관계형 DB |
|------|----------|-----------|
| 단일 필터 (워크스페이스) | ⚡ 빠름 (인덱스) | ⚡⚡ 매우 빠름 |
| 복합 필터 (4개 조건) | 🐌 느림 (인덱스 복잡) | ⚡⚡ 매우 빠름 |
| 집계 (SUM, COUNT) | 🐌🐌 매우 느림 (클라이언트) | ⚡⚡ 매우 빠름 (서버) |
| JOIN (거래+프로젝트) | 🐌 느림 (2번 쿼리) | ⚡⚡ 매우 빠름 (1번 쿼리) |
| 데이터 증가 시 | 📉 성능 저하 | 📈 인덱스로 유지 |

---

## 💡 이 프로젝트에 대한 권장사항

### ✅ **관계형 DB (SQLite/PostgreSQL) 추천**

**이유:**

1. **복잡한 필터링이 핵심 기능**
   - 워크스페이스 + 프로젝트 + 카테고리 + 날짜
   - 관계형 DB가 훨씬 효율적

2. **집계 연산이 많음**
   - 월별 합계, 프로젝트별 통계
   - DB에서 직접 계산이 빠름

3. **데이터가 점점 쌓임**
   - Firebase는 클라이언트 필터링으로 인해 느려짐
   - 관계형 DB는 인덱스로 성능 유지

4. **규모가 크지 않음**
   - SQLite로 시작 가능 (파일 기반, 설정 간단)
   - 나중에 PostgreSQL로 마이그레이션 가능

5. **비용 효율적**
   - SQLite: 무료
   - 읽기 횟수 제한 없음

### 🎯 추천 아키텍처

```
개발/소규모: SQLite
├── 파일 기반 (설정 간단)
├── 무료
└── 성능 충분

프로덕션/확장: PostgreSQL
├── 강력한 성능
├── 동시 접속 지원
└── 확장성
```

---

## 🔄 마이그레이션 전략

### Firebase → 관계형 DB 전환 시

1. **점진적 전환**
   - 새 기능은 관계형 DB 사용
   - 기존 데이터는 점진적으로 마이그레이션

2. **하이브리드 접근** (필요시)
   - 실시간 알림: Firebase
   - 데이터 저장/조회: 관계형 DB

---

## 📝 결론

**이 프로젝트에는 관계형 DB가 더 적합합니다.**

특히:
- ✅ 복잡한 필터링
- ✅ 집계 연산
- ✅ JOIN이 필요한 구조
- ✅ 데이터 증가 시 성능 유지

**Firebase가 적합한 경우:**
- 실시간 협업이 중요한 경우
- 단순한 CRUD 위주
- 복잡한 쿼리가 없는 경우

---

**작성일**: 2025-11-28


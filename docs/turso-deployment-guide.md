# Turso 배포 가이드

## 🚀 Turso란?

Turso는 SQLite와 100% 호환되는 원격 데이터베이스 서비스입니다.
- ✅ Vercel 공식 추천
- ✅ 서버리스 환경에서 완벽 작동
- ✅ 무료 티어: 1GB 스토리지, 월 500만 읽기/100만 쓰기

---

## 1단계: Turso 계정 생성 및 데이터베이스 생성

### 방법 1: Turso 웹사이트에서 생성

1. **Turso 계정 생성**
   - https://turso.tech 접속
   - GitHub 계정으로 로그인

2. **데이터베이스 생성**
   - Dashboard → Create Database
   - 데이터베이스 이름 입력 (예: `account-db`)
   - 지역 선택 (가장 가까운 지역, 예: `nrt` - Tokyo)
   - Create 클릭

3. **인증 토큰 생성**
   - Dashboard → Settings → Tokens
   - Create Token 클릭
   - 토큰 이름 입력 후 생성
   - ⚠️ **토큰을 복사해두세요! (한 번만 표시됨)**

### 방법 2: Turso CLI 사용 (선택사항)

```bash
# Turso CLI 설치
curl -sSfL https://get.tur.so/install.sh | bash

# 로그인
turso auth login

# 데이터베이스 생성
turso db create account-db

# 토큰 생성
turso db tokens create account-db
```

---

## 2단계: 데이터베이스 URL 및 토큰 확인

Turso Dashboard에서:
1. 데이터베이스 선택
2. **Connect** 탭 클릭
3. 다음 정보 확인:
   - **Database URL**: `libsql://account-db-xxxxx.turso.io`
   - **Auth Token**: `eyJ...` (긴 문자열)

---

## 3단계: Vercel 환경 변수 설정

### Vercel 대시보드에서 설정

1. **프로젝트 → Settings → Environment Variables**

2. **다음 환경 변수 추가:**

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `TURSO_DATABASE_URL` | `libsql://account-db-xxxxx.turso.io` | Turso 데이터베이스 URL |
| `TURSO_AUTH_TOKEN` | `eyJ...` | Turso 인증 토큰 |

3. **환경 적용:**
   - Production, Preview, Development 모두 선택
   - Save 클릭

### 로컬 개발용 (.env.local)

프로젝트 루트에 `.env.local` 파일 생성:

```env
TURSO_DATABASE_URL=libsql://account-db-xxxxx.turso.io
TURSO_AUTH_TOKEN=eyJ...
```

⚠️ **주의:** `.env.local`은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

---

## 4단계: 데이터베이스 초기화

### 방법 1: API 엔드포인트 사용 (배포 후)

배포 후 브라우저에서 또는 curl로:

```bash
# 프로덕션
curl -X POST https://your-domain.vercel.app/api/init-db

# 또는 브라우저에서
# https://your-domain.vercel.app/api/init-db
```

### 방법 2: 로컬에서 초기화

```bash
# .env.local 파일에 환경 변수 설정 후
npm run init-db
```

---

## 5단계: 배포 및 확인

### GitHub에 푸시

```bash
git add .
git commit -m "Turso 데이터베이스 설정"
git push origin main
```

### Vercel 자동 배포

- GitHub에 푸시하면 Vercel이 자동으로 배포합니다
- 배포 완료 후 `/api/init-db` 엔드포인트 호출하여 초기화

### 데이터베이스 확인

Turso Dashboard에서:
- 데이터베이스 → Tables 탭
- 다음 테이블들이 생성되었는지 확인:
  - `workspaces`
  - `app_settings`
  - `projects`
  - `transactions`
  - `transaction_receipts`
  - `documents`

---

## 🔧 트러블슈팅

### 문제: "TURSO_DATABASE_URL 환경 변수가 설정되지 않았습니다"

**해결:**
- Vercel 대시보드에서 환경 변수 확인
- `.env.local` 파일 확인 (로컬 개발 시)
- 환경 변수 이름이 정확한지 확인 (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`)

### 문제: "인증 실패"

**해결:**
- `TURSO_AUTH_TOKEN`이 올바른지 확인
- 토큰이 만료되지 않았는지 확인
- Turso Dashboard에서 새 토큰 생성

### 문제: "초기화 실패"

**해결:**
- Turso Dashboard에서 데이터베이스가 정상적으로 생성되었는지 확인
- 네트워크 연결 확인
- Vercel Functions 로그 확인

---

## 📊 무료 티어 제한

Turso 무료 티어:
- ✅ 스토리지: 1GB
- ✅ 읽기: 월 500만 건
- ✅ 쓰기: 월 100만 건
- ✅ 데이터베이스: 500개

**이 프로젝트에는 충분합니다!**

---

## 🎯 다음 단계

1. ✅ Turso 데이터베이스 생성 완료
2. ✅ 환경 변수 설정 완료
3. ✅ 데이터베이스 초기화 완료
4. 이제 API 개발 시작!

---

**작성일**: 2025-11-28


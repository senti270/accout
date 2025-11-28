# Vercel 배포 단계별 가이드

## 📋 전체 순서

1. GitHub 저장소 생성 및 코드 푸시
2. Vercel 프로젝트 생성 및 연결
3. Turso 데이터베이스 생성
4. Vercel 환경 변수 설정
5. 배포 및 데이터베이스 초기화

---

## 1단계: GitHub 저장소 생성 및 코드 푸시

### 1-1. GitHub 저장소 생성

1. **GitHub 접속**
   - https://github.com 접속
   - 로그인

2. **새 저장소 생성**
   - 우측 상단 `+` → `New repository` 클릭
   - Repository name: `account` (또는 원하는 이름)
   - Description: "회사/사업자별 입출금 관리 시스템"
   - Public 또는 Private 선택
   - **Initialize this repository with a README** 체크 해제 (이미 README 있음)
   - `Create repository` 클릭

3. **저장소 URL 확인**
   - 예: `https://github.com/your-username/account.git`

### 1-2. 로컬에서 Git 초기화 및 푸시

```bash
# 프로젝트 루트에서 실행

# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: Account management system"

# GitHub 저장소 연결
git remote add origin https://github.com/your-username/account.git

# 브랜치 이름을 main으로 설정 (필요시)
git branch -M main

# 푸시
git push -u origin main
```

⚠️ **주의사항:**
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 자동으로 제외됩니다
- `data/` 폴더도 제외됩니다

---

## 2단계: Vercel 프로젝트 생성 및 연결

### 2-1. Vercel 계정 생성 (없다면)

1. **Vercel 접속**
   - https://vercel.com 접속
   - `Sign Up` 클릭
   - GitHub 계정으로 로그인 (권장)

### 2-2. 프로젝트 생성

1. **새 프로젝트 추가**
   - Vercel 대시보드 → `Add New...` → `Project` 클릭
   - 또는 `New Project` 버튼 클릭

2. **GitHub 저장소 선택**
   - GitHub 저장소 목록에서 `account` 선택
   - `Import` 클릭

3. **프로젝트 설정**
   - **Project Name**: `account` (또는 원하는 이름)
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)

4. **환경 변수는 아직 설정하지 않음** (다음 단계에서 설정)
   - `Deploy` 클릭하여 일단 배포 진행
   - 배포는 실패할 수 있지만 괜찮습니다 (환경 변수 없어서)

---

## 3단계: Turso 데이터베이스 생성

### 3-1. Turso 계정 생성

1. **Turso 접속**
   - https://turso.tech 접속
   - `Sign Up` 또는 `Log In` 클릭
   - GitHub 계정으로 로그인 (권장)

### 3-2. 데이터베이스 생성

1. **대시보드 접속**
   - 로그인 후 Dashboard로 이동

2. **데이터베이스 생성**
   - `Create Database` 또는 `+ New Database` 클릭
   - **Database name**: `account-db` (또는 원하는 이름)
   - **Region**: 가장 가까운 지역 선택
     - 한국: `nrt` (Tokyo) 또는 `sin` (Singapore)
   - `Create` 클릭

3. **데이터베이스 URL 확인**
   - 데이터베이스 선택 → `Connect` 탭
   - **Database URL** 복사
     - 예: `libsql://account-db-xxxxx.turso.io`

### 3-3. 인증 토큰 생성

1. **토큰 생성**
   - 데이터베이스 → `Settings` → `Tokens` 탭
   - 또는 상단 메뉴 → `Settings` → `Tokens`
   - `Create Token` 클릭
   - **Token name**: `account-vercel` (또는 원하는 이름)
   - `Create` 클릭

2. **토큰 복사**
   - ⚠️ **중요**: 토큰은 한 번만 표시됩니다!
   - 토큰을 복사하여 안전한 곳에 저장
   - 예: `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...`

---

## 4단계: Vercel 환경 변수 설정

### 4-1. 환경 변수 추가

1. **Vercel 프로젝트 설정**
   - Vercel 대시보드 → 프로젝트 선택
   - `Settings` 탭 클릭
   - 좌측 메뉴에서 `Environment Variables` 클릭

2. **환경 변수 추가**

   **첫 번째 변수:**
   - **Name**: `TURSO_DATABASE_URL`
   - **Value**: Turso에서 복사한 Database URL
     - 예: `libsql://account-db-xxxxx.turso.io`
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - `Save` 클릭

   **두 번째 변수:**
   - **Name**: `TURSO_AUTH_TOKEN`
   - **Value**: Turso에서 복사한 Auth Token
     - 예: `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...`
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - `Save` 클릭

### 4-2. 환경 변수 확인

환경 변수 목록에 다음 2개가 있어야 합니다:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

---

## 5단계: 배포 및 데이터베이스 초기화

### 5-1. 재배포

환경 변수를 추가했으므로 재배포가 필요합니다.

**방법 1: 자동 재배포**
- 환경 변수 저장 후 자동으로 재배포가 시작될 수 있습니다
- `Deployments` 탭에서 배포 상태 확인

**방법 2: 수동 재배포**
- `Deployments` 탭 → 최신 배포 → `...` 메뉴 → `Redeploy` 클릭
- 또는 GitHub에 새로운 커밋 푸시

### 5-2. 배포 확인

1. **배포 완료 대기**
   - `Deployments` 탭에서 배포 상태 확인
   - `Ready` 상태가 되면 완료

2. **사이트 접속**
   - 배포 완료 후 제공되는 URL로 접속
   - 예: `https://account.vercel.app`

### 5-3. 데이터베이스 초기화

배포가 완료되면 데이터베이스를 초기화해야 합니다.

**방법 1: 브라우저에서 호출**
```
https://your-domain.vercel.app/api/init-db
```
- 브라우저에서 위 URL 접속
- 또는 `curl` 명령어 사용

**방법 2: curl 명령어**
```bash
curl -X POST https://your-domain.vercel.app/api/init-db
```

**방법 3: Postman 또는 다른 API 클라이언트**
- Method: `POST`
- URL: `https://your-domain.vercel.app/api/init-db`

**성공 응답:**
```json
{
  "success": true,
  "message": "데이터베이스 초기화 완료"
}
```

### 5-4. 초기화 확인

**Turso Dashboard에서 확인:**
1. Turso Dashboard → 데이터베이스 선택
2. `Tables` 탭 클릭
3. 다음 테이블들이 생성되었는지 확인:
   - `workspaces`
   - `app_settings`
   - `projects`
   - `transactions`
   - `transaction_receipts`
   - `documents`

---

## ✅ 배포 완료 체크리스트

- [ ] GitHub 저장소 생성 및 코드 푸시 완료
- [ ] Vercel 프로젝트 생성 및 GitHub 연결 완료
- [ ] Turso 데이터베이스 생성 완료
- [ ] Turso 인증 토큰 생성 완료
- [ ] Vercel 환경 변수 설정 완료
  - [ ] `TURSO_DATABASE_URL`
  - [ ] `TURSO_AUTH_TOKEN`
- [ ] Vercel 재배포 완료
- [ ] 데이터베이스 초기화 완료 (`/api/init-db` 호출)
- [ ] Turso Dashboard에서 테이블 확인 완료

---

## 🔧 트러블슈팅

### 문제: 배포 실패

**원인:**
- 환경 변수가 설정되지 않음
- 빌드 오류

**해결:**
1. Vercel → `Deployments` → 실패한 배포 클릭
2. 로그 확인
3. 환경 변수 확인

### 문제: 데이터베이스 초기화 실패

**원인:**
- 환경 변수 오타
- Turso 연결 실패

**해결:**
1. Vercel 환경 변수 재확인
2. Turso Dashboard에서 데이터베이스 상태 확인
3. Vercel Functions 로그 확인:
   - Vercel → 프로젝트 → `Functions` 탭 → 로그 확인

### 문제: API 호출 시 500 에러

**원인:**
- 데이터베이스 초기화 안 됨
- 환경 변수 누락

**해결:**
1. `/api/init-db` 호출하여 초기화
2. 환경 변수 확인

---

## 📝 다음 단계

배포가 완료되면:
1. 프론트엔드 개발 시작
2. API 테스트
3. 기능 추가

---

**작성일**: 2025-11-28


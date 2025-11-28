# Vercel 배포 빠른 시작 가이드

## 🚀 5분 안에 배포하기

### 1단계: Vercel에서 프로젝트 생성 (2분)

1. **Vercel 접속**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 추가**
   - `Add New...` → `Project` 클릭
   - 또는 `New Project` 버튼 클릭

3. **저장소 선택**
   - GitHub 저장소 목록에서 `accout` 선택
   - `Import` 클릭

4. **프로젝트 설정**
   - **Project Name**: `accout` (또는 원하는 이름)
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)

5. **환경 변수는 아직 설정하지 않음**
   - 일단 `Deploy` 클릭
   - 배포는 실패할 수 있지만 괜찮습니다 (환경 변수 없어서)

---

### 2단계: Turso 데이터베이스 정보 확인 (1분)

이미 Turso 데이터베이스를 생성했다면:
- Database URL: `libsql://account-senti270.aws-ap-northeast-1.turso.io`
- Auth Token: (이미 가지고 있음)

아직 안 만들었다면:
1. https://turso.tech 접속
2. GitHub 계정으로 로그인
3. Create Database → 이름 입력 → 생성
4. Connect 탭에서 URL 복사
5. Settings → Tokens → Create Token → 토큰 복사

---

### 3단계: Vercel 환경 변수 설정 (1분)

1. **Vercel 프로젝트 설정**
   - 배포 완료 후 (또는 실패해도) 프로젝트 선택
   - `Settings` 탭 클릭
   - 좌측 메뉴 `Environment Variables` 클릭

2. **환경 변수 추가**

   **첫 번째:**
   - Name: `TURSO_DATABASE_URL`
   - Value: `libsql://account-senti270.aws-ap-northeast-1.turso.io`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - `Save` 클릭

   **두 번째:**
   - Name: `TURSO_AUTH_TOKEN`
   - Value: (Turso에서 복사한 토큰)
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - `Save` 클릭

---

### 4단계: 재배포 (1분)

1. **자동 재배포**
   - 환경 변수 저장 후 자동으로 재배포 시작될 수 있음
   - `Deployments` 탭에서 확인

2. **수동 재배포 (필요시)**
   - `Deployments` 탭
   - 최신 배포 → `...` 메뉴 → `Redeploy` 클릭

3. **배포 완료 대기**
   - `Ready` 상태가 되면 완료
   - 배포 URL 확인 (예: `https://accout.vercel.app`)

---

### 5단계: 데이터베이스 초기화 (30초)

배포 완료 후:

**방법 1: 브라우저에서**
```
https://your-domain.vercel.app/api/init-db
```
- 브라우저에서 위 URL 접속
- 또는 `curl` 명령어 사용

**방법 2: curl 명령어**
```bash
curl -X POST https://your-domain.vercel.app/api/init-db
```

**성공 응답:**
```json
{
  "success": true,
  "message": "데이터베이스 초기화 완료"
}
```

---

## ✅ 완료!

이제 다음 URL로 접속 가능:
- 사이트: `https://your-domain.vercel.app`
- API: `https://your-domain.vercel.app/api/...`

---

## 🔧 문제 해결

### 배포 실패?
- `Deployments` 탭 → 실패한 배포 클릭 → 로그 확인
- 환경 변수가 제대로 설정되었는지 확인

### 초기화 실패?
- Vercel → Functions 탭 → 로그 확인
- 환경 변수 재확인
- Turso Dashboard에서 데이터베이스 상태 확인

---

**작성일**: 2025-11-28


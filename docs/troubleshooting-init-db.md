# 데이터베이스 초기화 문제 해결

## 405 에러 발생 시

### 1. 배포 상태 확인

Vercel 대시보드에서:
1. 프로젝트 → `Deployments` 탭
2. 최신 배포 상태 확인
3. 빌드가 성공했는지 확인

### 2. 수동 재배포

배포가 실패했다면:
1. `Deployments` 탭
2. 최신 배포 → `...` 메뉴 → `Redeploy`

### 3. 대안: curl 명령어 사용

터미널에서 POST 요청으로 시도:

```bash
curl -X POST https://account-14z64ay6o-jinyoung-lees-projects.vercel.app/api/init-db
```

### 4. 대안: 브라우저 개발자 도구 사용

1. 브라우저에서 F12 (개발자 도구 열기)
2. `Console` 탭
3. 다음 코드 실행:

```javascript
fetch('/api/init-db', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### 5. Vercel Functions 로그 확인

Vercel 대시보드에서:
1. 프로젝트 → `Functions` 탭
2. `/api/init-db` 클릭
3. 로그 확인하여 오류 메시지 확인

---

## 다른 가능한 문제들

### 환경 변수 미설정

`TURSO_DATABASE_URL`과 `TURSO_AUTH_TOKEN`이 설정되지 않았다면:
1. Vercel → Settings → Environment Variables
2. 두 변수 모두 추가 확인

### 데이터베이스 연결 실패

Turso 데이터베이스가 정상적으로 생성되었는지 확인:
1. Turso Dashboard 접속
2. 데이터베이스 상태 확인

---

**작성일**: 2025-11-28


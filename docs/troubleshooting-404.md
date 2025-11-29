# 404 에러 해결 가이드

## 가능한 원인들

### 1. Vercel 빌드 실패
- Vercel 대시보드 → Deployments 탭
- 실패한 배포의 로그 확인
- 빌드 오류 메시지 확인

### 2. 클라이언트 사이드 라우팅 문제
- 브라우저 개발자 도구 → Console 탭
- JavaScript 오류 확인

### 3. Layout 컴포넌트 인증 로직
- Layout 컴포넌트가 인증 체크를 하고 있음
- 인증되지 않으면 로그인으로 리다이렉트

## 해결 방법

### 방법 1: Vercel Functions 로그 확인
1. Vercel 대시보드 → 프로젝트
2. Functions 탭
3. 각 함수의 로그 확인

### 방법 2: 브라우저 개발자 도구 확인
1. F12 → Console 탭
2. Network 탭
3. 404 발생 시 요청 URL 확인

### 방법 3: 테스트 페이지 확인
```
https://your-domain.vercel.app/test
```
- 이 페이지가 보이면 라우팅은 정상
- Layout 컴포넌트 문제일 가능성

### 방법 4: 직접 URL 입력
브라우저 주소창에 직접 입력:
- `/login` - 로그인 페이지
- `/test` - 테스트 페이지 (Layout 없음)

---

**작성일**: 2025-11-28


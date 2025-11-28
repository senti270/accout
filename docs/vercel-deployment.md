# Vercel 배포 가이드

## 사전 준비

1. **Vercel Postgres 데이터베이스 생성**
   - Vercel 대시보드 → Storage → Create Database
   - Postgres 선택
   - 데이터베이스 생성 후 `DATABASE_URL` 자동 설정됨

2. **GitHub 저장소 연결**
   - Vercel 대시보드 → Add New Project
   - GitHub 저장소 선택

---

## 배포 단계

### 1. Vercel Postgres 설정

```bash
# Vercel CLI로 데이터베이스 생성 (선택사항)
vercel postgres create
```

또는 Vercel 대시보드에서:
1. 프로젝트 → Storage 탭
2. Create Database → Postgres 선택
3. 데이터베이스 이름 입력 후 생성

### 2. 환경 변수 확인

Vercel Postgres를 생성하면 자동으로 다음 환경 변수가 설정됩니다:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

우리 코드는 `DATABASE_URL`을 사용하므로, Vercel 대시보드에서:
- Settings → Environment Variables
- `DATABASE_URL` = `POSTGRES_URL` 값으로 설정

### 3. 데이터베이스 초기화

배포 후 데이터베이스를 초기화해야 합니다.

**방법 1: Vercel 대시보드에서 실행**
1. 프로젝트 → Functions 탭
2. `/api/init-db` 엔드포인트 생성 (아래 코드 참고)

**방법 2: 로컬에서 초기화**
```bash
# 환경 변수 설정
export DATABASE_URL="your_postgres_url"

# 초기화 실행
npm run init-db
```

---

## 데이터베이스 초기화 API 엔드포인트

배포 후 한 번만 실행하면 됩니다:

```typescript
// src/app/api/init-db/route.ts
import { initializeDatabase } from "@/lib/db-init";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: "데이터베이스 초기화 완료" });
  } catch (error) {
    console.error("초기화 오류:", error);
    return NextResponse.json(
      { success: false, message: "초기화 실패" },
      { status: 500 }
    );
  }
}
```

배포 후 `https://your-domain.vercel.app/api/init-db`에 POST 요청을 보내면 초기화됩니다.

---

## 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `DATABASE_URL` | `postgres://...` | PostgreSQL 연결 문자열 |

---

## 배포 후 확인

1. **데이터베이스 연결 확인**
   ```bash
   # Vercel Functions 로그 확인
   vercel logs
   ```

2. **초기화 확인**
   - `/api/init-db` 엔드포인트 호출
   - 또는 Vercel Postgres 대시보드에서 테이블 확인

---

## 주의사항

⚠️ **중요:**
- Vercel은 서버리스 환경이므로 SQLite를 사용할 수 없습니다
- 반드시 PostgreSQL을 사용해야 합니다
- `DATABASE_URL` 환경 변수가 설정되어 있으면 자동으로 PostgreSQL 사용

✅ **로컬 개발:**
- `DATABASE_URL`이 없으면 자동으로 SQLite 사용
- 로컬에서는 `data/account.db` 파일 사용

---

## 트러블슈팅

### 문제: 데이터베이스 연결 실패
- `DATABASE_URL` 환경 변수 확인
- Vercel Postgres가 정상적으로 생성되었는지 확인

### 문제: 초기화 실패
- Vercel Functions 로그 확인
- 데이터베이스 권한 확인

---

**작성일**: 2025-11-28


# Account Management System

회사/사업자별 입출금 및 프로젝트 관리 시스템

## 🚀 기술 스택

- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript
- **Database**: Turso (SQLite 호환) - Vercel 배포용
- **Styling**: Tailwind CSS 4
- **Authentication**: bcrypt

## 📋 주요 기능

1. **워크스페이스 관리**
   - 회사/사업자별 관리
   - 추가/수정/삭제

2. **프로젝트 관리**
   - 프로젝트별 입출금 추적
   - 프로젝트 기간 및 메모 관리

3. **입출금 내역**
   - 카테고리별 분류
   - 증빙서류 이미지 첨부

4. **서류 관리**
   - 사업자등록증, 임대차계약서 등
   - 유효기간 관리

5. **비밀번호 보호**
   - 초기 비밀번호: 2906
   - 설정에서 변경 가능

## 🛠️ 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
# Turso 사용 시 (Vercel 배포)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# 로컬 개발 시 (SQLite 사용하려면 주석 처리)
# TURSO_DATABASE_URL=
# TURSO_AUTH_TOKEN=
```

### 3. 데이터베이스 초기화

```bash
npm run init-db
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 📦 배포 (Vercel)

### 1. Turso 데이터베이스 생성

1. https://turso.tech 접속
2. GitHub 계정으로 로그인
3. 데이터베이스 생성
4. 토큰 생성

자세한 내용: [Turso 배포 가이드](./docs/turso-deployment-guide.md)

### 2. Vercel 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

### 3. 배포 후 초기화

배포 완료 후:
```
POST https://your-domain.vercel.app/api/init-db
```

## 📁 프로젝트 구조

```
account/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API 라우트
│   │   └── ...
│   ├── lib/              # 유틸리티
│   │   ├── db.ts         # 데이터베이스 연결
│   │   ├── db-turso.ts   # Turso 연결
│   │   ├── db-init.ts    # 스키마 초기화
│   │   └── auth.ts       # 인증
│   ├── types/            # TypeScript 타입
│   └── components/       # React 컴포넌트
├── docs/                 # 문서
├── database/             # SQL 스키마
└── scripts/              # 스크립트
```

## 🗄️ 데이터베이스

- **로컬 개발**: SQLite (파일 기반)
- **프로덕션**: Turso (SQLite 호환, 원격)

환경 변수에 따라 자동 선택:
- `TURSO_DATABASE_URL` 있으면 → Turso
- 없으면 → 로컬 SQLite

## 📚 문서

- [데이터베이스 스키마](./docs/database-schema.md)
- [Turso 배포 가이드](./docs/turso-deployment-guide.md)
- [데이터베이스 비교](./docs/database-comparison.md)

## 🔐 보안

- 비밀번호는 bcrypt로 해시하여 저장
- 초기 비밀번호: `2906` (첫 실행 시 변경 권장)

## 📝 라이선스

Private


# 배포 가이드

## 배포 환경별 데이터베이스 선택

### SQLite 사용 가능한 환경
✅ **단일 인스턴스 서버**
- Railway
- Render
- DigitalOcean App Platform
- AWS EC2
- 기타 단일 서버 환경

**특징:**
- 파일 기반 데이터베이스
- 영구적인 파일 시스템 필요
- 단일 인스턴스에서만 작동

---

### PostgreSQL 필요 환경
❌ **서버리스 환경**
- Vercel
- Netlify Functions
- AWS Lambda

**특징:**
- 파일 시스템이 영구적이지 않음
- 여러 인스턴스가 동시에 실행될 수 있음
- 외부 데이터베이스 서비스 필요

---

## 배포 옵션별 설정

### 옵션 1: Railway (SQLite 사용 가능) ⭐ 추천

Railway는 영구적인 파일 시스템을 제공하므로 SQLite를 사용할 수 있습니다.

**설정:**
1. Railway에 프로젝트 연결
2. 환경 변수 설정 불필요 (SQLite는 파일 기반)
3. 빌드 후 `npm run init-db` 실행

**장점:**
- 설정 간단
- 무료 티어 제공
- SQLite 사용 가능

---

### 옵션 2: Render (SQLite 사용 가능)

Render도 영구적인 파일 시스템을 제공합니다.

**설정:**
1. Render에 프로젝트 연결
2. 빌드 명령: `npm install && npm run build`
3. 시작 명령: `npm run init-db && npm start`

---

### 옵션 3: Vercel (PostgreSQL 필요)

Vercel은 서버리스 환경이므로 PostgreSQL이 필요합니다.

**설정:**
1. Vercel에 프로젝트 연결
2. PostgreSQL 데이터베이스 추가 (Vercel Postgres 또는 외부 서비스)
3. 환경 변수 설정:
   - `DATABASE_URL`: PostgreSQL 연결 문자열
4. 코드를 PostgreSQL용으로 변경

---

## 배포 전 체크리스트

- [ ] 데이터베이스 초기화 스크립트 확인
- [ ] 환경 변수 설정 (필요한 경우)
- [ ] 빌드 스크립트 확인
- [ ] 데이터베이스 백업 계획 수립
- [ ] .env 파일 제외 확인 (.gitignore)

---

## 데이터베이스 백업

### SQLite 백업
```bash
# 로컬에서 백업
cp data/account.db data/account.db.backup

# 또는 SQL 덤프
sqlite3 data/account.db .dump > backup.sql
```

### 자동 백업 (Railway/Render)
- 정기적으로 데이터베이스 파일을 다운로드
- 또는 S3 같은 클라우드 스토리지에 자동 업로드

---

## PostgreSQL로 전환하기

배포 환경이 서버리스인 경우, PostgreSQL로 전환할 수 있습니다.

**필요한 작업:**
1. `pg` 패키지 설치
2. `src/lib/db.ts` 수정 (PostgreSQL 연결)
3. `database/schema.postgresql.sql` 사용
4. 환경 변수 `DATABASE_URL` 설정

---

**작성일**: 2025-11-28


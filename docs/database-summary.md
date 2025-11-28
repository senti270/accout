# 데이터베이스 스키마 요약

## 📋 테이블 목록

### 1. **workspaces** - 회사/사업자 관리
- 회사 또는 사업자 정보를 저장
- 상단에서 선택하여 사용
- 설정에서 추가/수정/삭제 가능

### 2. **app_settings** - 앱 설정
- 접속 비밀번호 저장 (해시값)
- 초기 비밀번호: 2906
- 설정에서 수정 가능

### 3. **projects** - 프로젝트 관리
- 프로젝트 아이디 (PK, 사용자 지정)
- 프로젝트명, 기간, 메모
- 워크스페이스별 관리

### 4. **transactions** - 입출금 내역
- 프로젝트별 거래 기록
- 카테고리 (태그)
- 입금액/출금액
- 거래일자

### 5. **transaction_receipts** - 거래 증빙서류
- 거래별 이미지 첨부
- 여러 파일 첨부 가능

### 6. **documents** - 각종 서류 관리
- 사업자등록증, 임대차계약서 등
- 서류 종류별 분류
- 유효기간 관리

---

## 🔗 관계도

```
workspaces (1) ──< (N) projects
                └──< (N) transactions
                └──< (N) documents

projects (1) ──< (N) transactions

transactions (1) ──< (N) transaction_receipts
```

---

## 🎯 주요 기능별 테이블 매핑

| 기능 | 관련 테이블 |
|------|------------|
| 워크스페이스 선택/관리 | `workspaces` |
| 비밀번호 관리 | `app_settings` |
| 프로젝트 관리 | `projects` |
| 입출금 내역 | `transactions`, `transaction_receipts` |
| 각종 서류 관리 | `documents` |

---

## 📝 주요 특징

1. **워크스페이스 중심 구조**
   - 모든 데이터는 워크스페이스에 종속
   - 워크스페이스 삭제 시 관련 데이터 자동 삭제 (CASCADE)

2. **유연한 프로젝트 관리**
   - 프로젝트 아이디는 사용자가 직접 지정
   - 기간과 메모로 상세 정보 관리

3. **거래 내역 관리**
   - 입금/출금을 하나의 필드로 구분
   - 카테고리로 태그처럼 분류
   - 증빙서류 이미지 다중 첨부 가능

4. **서류 관리**
   - 서류 종류별 분류
   - 유효기간 추적 가능

---

## 🔐 보안 고려사항

1. **비밀번호 관리**
   - bcrypt로 해시하여 저장
   - 초기 비밀번호: 2906 (첫 실행 시 변경 권장)

2. **데이터 무결성**
   - 외래키 제약조건으로 관계 유지
   - CASCADE 삭제로 데이터 일관성 보장

---

## 📁 파일 위치

- **스키마 문서**: `docs/database-schema.md`
- **SQLite 스키마**: `database/schema.sql`
- **PostgreSQL 스키마**: `database/schema.postgresql.sql`
- **TypeScript 타입**: `src/types/database.ts`

---

**작성일**: 2025-11-28


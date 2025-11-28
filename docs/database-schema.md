# 데이터베이스 스키마 설계

## 프로젝트 개요

회사/사업자별 입출금 및 프로젝트 관리 시스템

---

## 테이블 구조

### 1. workspaces (회사/사업자 관리)

회사 또는 사업자 정보를 관리하는 테이블입니다.

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 워크스페이스 고유 ID |
| name | VARCHAR(255) | NOT NULL, UNIQUE | 회사/사업자 이름 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 수정일시 |

**주요 기능:**
- 상단에서 워크스페이스 선택 가능
- 설정 메뉴에서 추가/수정/삭제 가능

---

### 2. app_settings (앱 설정)

전역 앱 설정을 관리하는 테이블입니다. (단일 레코드)

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 설정 고유 ID (항상 1) |
| access_password | VARCHAR(255) | NOT NULL | 접속 비밀번호 (해시값 저장) |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 수정일시 |

**주요 기능:**
- 초기 비밀번호: 2906
- 설정 메뉴에서 수정 가능
- 비밀번호는 해시하여 저장 (bcrypt 권장)

---

### 3. projects (프로젝트 관리)

워크스페이스별 프로젝트를 관리하는 테이블입니다.

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | VARCHAR(50) | PRIMARY KEY | 프로젝트 아이디 (PK) |
| workspace_id | INTEGER | NOT NULL, FOREIGN KEY → workspaces.id | 워크스페이스 ID |
| name | VARCHAR(255) | NOT NULL | 프로젝트명 |
| start_date | DATE | NULL | 프로젝트 시작일 |
| end_date | DATE | NULL | 프로젝트 종료일 |
| memo | TEXT | NULL | 메모 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 수정일시 |

**주요 기능:**
- 프로젝트 아이디는 사용자가 직접 입력 (PK)
- 워크스페이스별로 관리

**인덱스:**
- `idx_workspace_id` on `workspace_id`

---

### 4. transactions (입출금 내역)

프로젝트별 입출금 내역을 관리하는 테이블입니다.

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 거래 고유 ID |
| workspace_id | INTEGER | NOT NULL, FOREIGN KEY → workspaces.id | 워크스페이스 ID |
| project_id | VARCHAR(50) | NOT NULL, FOREIGN KEY → projects.id | 프로젝트 아이디 |
| category | VARCHAR(100) | NOT NULL | 카테고리 (태그처럼 사용) |
| deposit_amount | DECIMAL(15, 2) | NOT NULL, DEFAULT 0 | 입금액 |
| withdrawal_amount | DECIMAL(15, 2) | NOT NULL, DEFAULT 0 | 출금액 |
| transaction_date | DATE | NOT NULL | 거래일자 |
| memo | TEXT | NULL | 메모 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 수정일시 |

**주요 기능:**
- 입금과 출금을 동시에 기록할 수 있지만, 일반적으로 하나만 사용
- 카테고리는 태그처럼 자유롭게 입력 가능

**인덱스:**
- `idx_workspace_id` on `workspace_id`
- `idx_project_id` on `project_id`
- `idx_transaction_date` on `transaction_date`
- `idx_category` on `category`

---

### 5. transaction_receipts (거래 증빙서류)

거래별 증빙서류 이미지를 관리하는 테이블입니다.

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 증빙서류 고유 ID |
| transaction_id | INTEGER | NOT NULL, FOREIGN KEY → transactions.id ON DELETE CASCADE | 거래 ID |
| image_url | VARCHAR(500) | NOT NULL | 이미지 파일 경로 또는 URL |
| file_name | VARCHAR(255) | NULL | 원본 파일명 |
| file_size | INTEGER | NULL | 파일 크기 (bytes) |
| mime_type | VARCHAR(100) | NULL | MIME 타입 (image/jpeg, image/png 등) |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일시 |

**주요 기능:**
- 하나의 거래에 여러 증빙서류 첨부 가능
- 이미지 붙여넣기 지원
- 거래 삭제 시 관련 증빙서류도 자동 삭제 (CASCADE)

**인덱스:**
- `idx_transaction_id` on `transaction_id`

---

### 6. documents (각종 서류 관리)

워크스페이스별 각종 서류를 관리하는 테이블입니다.

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 서류 고유 ID |
| workspace_id | INTEGER | NOT NULL, FOREIGN KEY → workspaces.id | 워크스페이스 ID |
| document_type | VARCHAR(100) | NOT NULL | 서류 종류 (예: 사업자등록증, 임대차계약서 등) |
| title | VARCHAR(255) | NOT NULL | 서류 제목 |
| file_url | VARCHAR(500) | NOT NULL | 파일 경로 또는 URL |
| file_name | VARCHAR(255) | NULL | 원본 파일명 |
| file_size | INTEGER | NULL | 파일 크기 (bytes) |
| mime_type | VARCHAR(100) | NULL | MIME 타입 |
| expiry_date | DATE | NULL | 유효기간 만료일 (있는 경우) |
| memo | TEXT | NULL | 메모 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 수정일시 |

**주요 기능:**
- 사업자등록증, 임대차계약서 등 필요서류 관리
- 서류 종류별로 분류
- 유효기간 관리 (선택사항)

**인덱스:**
- `idx_workspace_id` on `workspace_id`
- `idx_document_type` on `document_type`
- `idx_expiry_date` on `expiry_date`

---

## 관계도 (ERD)

```
workspaces (1) ──< (N) projects
workspaces (1) ──< (N) transactions
workspaces (1) ──< (N) documents
projects (1) ──< (N) transactions
transactions (1) ──< (N) transaction_receipts
```

---

## 데이터베이스 선택 고려사항

### 옵션 1: SQLite (개인/소규모 프로젝트)
- 파일 기반 DB, 설정 간단
- 별도 서버 불필요
- 개발/테스트 용이

### 옵션 2: PostgreSQL (프로덕션 권장)
- 강력한 관계형 DB
- 확장성 좋음
- 다양한 데이터 타입 지원

### 옵션 3: MySQL/MariaDB
- 널리 사용되는 DB
- 설정 및 운영 편리

---

## 추가 고려사항

1. **이미지 저장 방식:**
   - 로컬 파일 시스템: `public/uploads/`
   - 클라우드 저장소: AWS S3, Cloudinary 등

2. **비밀번호 보안:**
   - bcrypt로 해싱하여 저장
   - 비밀번호 변경 시 재해싱

3. **데이터 무결성:**
   - 워크스페이스 삭제 시 관련 데이터 처리 방안 필요
   - SOFT DELETE 고려 (deleted_at 필드 추가)

4. **카테고리 관리:**
   - 현재는 자유 입력
   - 추후 카테고리 마스터 테이블 도입 가능

---

**작성일**: 2025-11-28


-- ============================================
-- Account Management System Database Schema
-- PostgreSQL 버전
-- ============================================

-- 1. Workspaces 테이블
CREATE TABLE IF NOT EXISTS workspaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_workspaces_timestamp 
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- 2. App Settings 테이블
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    access_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_app_settings_timestamp 
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 초기 비밀번호 설정 (실제로는 애플리케이션에서 bcrypt로 해시하여 저장)
INSERT INTO app_settings (id, access_password) 
VALUES (1, '$2b$10$example_hash_here') 
ON CONFLICT (id) DO NOTHING;

-- ============================================

-- 3. Projects 테이블
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    memo TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_projects_timestamp 
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- 4. Transactions 테이블
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL,
    project_id VARCHAR(50) NOT NULL,
    vendor_id INTEGER,
    category VARCHAR(100) NOT NULL,
    deposit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    withdrawal_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    transaction_date DATE NOT NULL,
    description TEXT,
    memo TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_id ON transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_vendor_id ON transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_transactions_timestamp 
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- 5. Transaction Receipts 테이블
CREATE TABLE IF NOT EXISTS transaction_receipts (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_transaction_receipts_transaction_id ON transaction_receipts(transaction_id);

-- ============================================

-- 6. Documents 테이블
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    expiry_date DATE,
    memo TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON documents(expiry_date);

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_documents_timestamp 
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- 7. Vendors (거래처) 테이블
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL,
    business_number VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    tax_email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_vendors_workspace_id ON vendors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_business_number ON vendors(business_number);

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_vendors_timestamp 
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Transactions 테이블에 vendor_id 컬럼 추가
-- ALTER TABLE transactions ADD COLUMN vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL;
-- CREATE INDEX IF NOT EXISTS idx_transactions_vendor_id ON transactions(vendor_id);

-- ============================================
-- 스키마 생성 완료
-- ============================================


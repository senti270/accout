/**
 * 데이터베이스 초기화 및 스키마 생성
 * SQLite와 PostgreSQL 모두 지원
 */

import { getDatabase, getDatabaseType, getSQLiteDatabase } from "./db";
import bcrypt from "bcrypt";
import { migrateVendors } from "./db-migrate";
import { migrateDashboardTables } from "./db-migrate-dashboard";

/**
 * 데이터베이스 스키마 초기화
 */
export async function initializeDatabase(): Promise<void> {
  const dbType = getDatabaseType();
  const db = getDatabase();

  try {
    if (dbType === "sqlite") {
      await initializeSQLite();
    } else if (dbType === "turso") {
      await initializeTurso();
    } else {
      await initializePostgreSQL();
    }

    // 초기 비밀번호 설정 (2906)
    await initializePassword();

    // vendors 테이블 마이그레이션 (기존 DB 호환)
    try {
      await migrateVendors();
    } catch (error) {
      console.warn("⚠️ vendors 마이그레이션 경고:", error);
      // 마이그레이션 실패해도 계속 진행
    }

    // 대시보드 테이블 마이그레이션 (기존 DB 호환)
    try {
      await migrateDashboardTables();
    } catch (error) {
      console.warn("⚠️ 대시보드 테이블 마이그레이션 경고:", error);
      // 마이그레이션 실패해도 계속 진행
    }

    console.log("✅ 데이터베이스 스키마 초기화 완료");
  } catch (error) {
    console.error("❌ 데이터베이스 초기화 실패:", error);
    throw error;
  }
}

/**
 * SQLite 스키마 초기화
 */
async function initializeSQLite(): Promise<void> {
  const sqliteDb = getSQLiteDatabase();
  if (!sqliteDb) {
    throw new Error("SQLite 데이터베이스 연결 실패");
  }

  // SQLite는 exec로 여러 명령 실행 가능
  sqliteDb.exec(`
    -- 1. Workspaces 테이블
    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS update_workspaces_timestamp 
      AFTER UPDATE ON workspaces
      FOR EACH ROW
    BEGIN
      UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- 2. App Settings 테이블
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      access_password VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS update_app_settings_timestamp 
      AFTER UPDATE ON app_settings
      FOR EACH ROW
    BEGIN
      UPDATE app_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- 3. Projects 테이블
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(50) PRIMARY KEY,
      workspace_id INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      start_date DATE,
      end_date DATE,
      memo TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);

    CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
      AFTER UPDATE ON projects
      FOR EACH ROW
    BEGIN
      UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- 3-1. Vendors (거래처) 테이블 (Transactions보다 먼저 생성 필요)
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      business_number VARCHAR(20),
      name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(100),
      contact_phone VARCHAR(50),
      tax_email VARCHAR(255),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_vendors_workspace_id ON vendors(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
    CREATE INDEX IF NOT EXISTS idx_vendors_business_number ON vendors(business_number);

    CREATE TRIGGER IF NOT EXISTS update_vendors_timestamp 
      AFTER UPDATE ON vendors
      FOR EACH ROW
    BEGIN
      UPDATE vendors SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- 4. Transactions 테이블
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      project_id VARCHAR(50) NOT NULL,
      vendor_id INTEGER,
      category VARCHAR(100) NOT NULL,
      deposit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      withdrawal_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      transaction_date DATE NOT NULL,
      description TEXT,
      memo TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_workspace_id ON transactions(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_vendor_id ON transactions(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

    CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp 
      AFTER UPDATE ON transactions
      FOR EACH ROW
    BEGIN
      UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- 5. Transaction Receipts 테이블
    CREATE TABLE IF NOT EXISTS transaction_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      file_name VARCHAR(255),
      file_size INTEGER,
      mime_type VARCHAR(100),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_transaction_receipts_transaction_id ON transaction_receipts(transaction_id);

    -- 6. Documents 테이블
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      document_type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      file_url VARCHAR(500) NOT NULL,
      file_name VARCHAR(255),
      file_size INTEGER,
      mime_type VARCHAR(100),
      expiry_date DATE,
      memo TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
    CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON documents(expiry_date);

    CREATE TRIGGER IF NOT EXISTS update_documents_timestamp 
      AFTER UPDATE ON documents
      FOR EACH ROW
    BEGIN
      UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- 7. Comments (코멘트) 테이블
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_comments_workspace_id ON comments(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

    CREATE TRIGGER IF NOT EXISTS update_comments_timestamp 
      AFTER UPDATE ON comments
      FOR EACH ROW
    BEGIN
      UPDATE comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- 8. Comment Attachments (코멘트 첨부파일) 테이블
    CREATE TABLE IF NOT EXISTS comment_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      file_name VARCHAR(255),
      file_size INTEGER,
      mime_type VARCHAR(100),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON comment_attachments(comment_id);

    -- 9. Todos (할일 목록) 테이블
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      due_date DATE,
      is_completed BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_todos_workspace_id ON todos(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
    CREATE INDEX IF NOT EXISTS idx_todos_is_completed ON todos(is_completed);

    CREATE TRIGGER IF NOT EXISTS update_todos_timestamp 
      AFTER UPDATE ON todos
      FOR EACH ROW
    BEGIN
      UPDATE todos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    -- 10. Todo Attachments (할일 첨부파일) 테이블
    CREATE TABLE IF NOT EXISTS todo_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      todo_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      file_name VARCHAR(255),
      file_size INTEGER,
      mime_type VARCHAR(100),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_todo_attachments_todo_id ON todo_attachments(todo_id);

    -- 11. Bookmarks (URL 바로가기) 테이블
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_workspace_id ON bookmarks(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at);

    CREATE TRIGGER IF NOT EXISTS update_bookmarks_timestamp 
      AFTER UPDATE ON bookmarks
      FOR EACH ROW
    BEGIN
      UPDATE bookmarks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
}

/**
 * Turso 스키마 초기화 (SQLite 호환)
 */
async function initializeTurso(): Promise<void> {
  const db = getDatabase();

  // Turso는 SQLite와 호환되므로 SQLite 스키마 사용
  // 단, 일부 SQLite 전용 문법은 조정 필요
  const queries = [
    // 1. Workspaces 테이블
    `CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TRIGGER IF NOT EXISTS update_workspaces_timestamp 
      AFTER UPDATE ON workspaces
      FOR EACH ROW
    BEGIN
      UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END`,

    // 2. App Settings 테이블
    `CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      access_password TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TRIGGER IF NOT EXISTS update_app_settings_timestamp 
      AFTER UPDATE ON app_settings
      FOR EACH ROW
    BEGIN
      UPDATE app_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END`,

    // 3. Projects 테이블
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      workspace_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      start_date DATE,
      end_date DATE,
      memo TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id)`,
    `CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
      AFTER UPDATE ON projects
      FOR EACH ROW
    BEGIN
      UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END`,

    // 3-1. Vendors (거래처) 테이블 (Transactions보다 먼저 생성 필요)
    `CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      business_number TEXT,
      name TEXT NOT NULL,
      contact_person TEXT,
      contact_phone TEXT,
      tax_email TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_vendors_workspace_id ON vendors(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name)`,
    `CREATE INDEX IF NOT EXISTS idx_vendors_business_number ON vendors(business_number)`,
    `CREATE TRIGGER IF NOT EXISTS update_vendors_timestamp 
      AFTER UPDATE ON vendors
      FOR EACH ROW
    BEGIN
      UPDATE vendors SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END`,

    // 4. Transactions 테이블
    `CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      project_id TEXT NOT NULL,
      vendor_id INTEGER,
      category TEXT NOT NULL,
      deposit_amount REAL NOT NULL DEFAULT 0,
      withdrawal_amount REAL NOT NULL DEFAULT 0,
      transaction_date DATE NOT NULL,
      description TEXT,
      memo TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_workspace_id ON transactions(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_vendor_id ON transactions(vendor_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`,
    `CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp 
      AFTER UPDATE ON transactions
      FOR EACH ROW
    BEGIN
      UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END`,

    // 5. Transaction Receipts 테이블
    `CREATE TABLE IF NOT EXISTS transaction_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      file_name TEXT,
      file_size INTEGER,
      mime_type TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_transaction_receipts_transaction_id ON transaction_receipts(transaction_id)`,

    // 6. Documents 테이블
    `CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_name TEXT,
      file_size INTEGER,
      mime_type TEXT,
      expiry_date DATE,
      memo TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type)`,
    `CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON documents(expiry_date)`,
    `CREATE TRIGGER IF NOT EXISTS update_documents_timestamp 
      AFTER UPDATE ON documents
      FOR EACH ROW
    BEGIN
      UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END`,
    // 7. Comments (코멘트) 테이블
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_comments_workspace_id ON comments(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)`,
    `CREATE TRIGGER IF NOT EXISTS update_comments_timestamp 
      AFTER UPDATE ON comments
      FOR EACH ROW
    BEGIN
      UPDATE comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END`,
    // 8. Comment Attachments (코멘트 첨부파일) 테이블
    `CREATE TABLE IF NOT EXISTS comment_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      file_name TEXT,
      file_size INTEGER,
      mime_type TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON comment_attachments(comment_id)`,
    // 9. Todos (할일 목록) 테이블
    `CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      due_date DATE,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_todos_workspace_id ON todos(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)`,
    `CREATE INDEX IF NOT EXISTS idx_todos_is_completed ON todos(is_completed)`,
    `CREATE TRIGGER IF NOT EXISTS update_todos_timestamp 
      AFTER UPDATE ON todos
      FOR EACH ROW
    BEGIN
      UPDATE todos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END`,
    // 10. Todo Attachments (할일 첨부파일) 테이블
    `CREATE TABLE IF NOT EXISTS todo_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      todo_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      file_name TEXT,
      file_size INTEGER,
      mime_type TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_todo_attachments_todo_id ON todo_attachments(todo_id)`,
    // 11. Bookmarks (URL 바로가기) 테이블
    `CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_bookmarks_workspace_id ON bookmarks(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at)`,
    `CREATE TRIGGER IF NOT EXISTS update_bookmarks_timestamp 
      AFTER UPDATE ON bookmarks
      FOR EACH ROW
    BEGIN
      UPDATE bookmarks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END`,
  ];

  // Turso는 각 쿼리를 개별 실행
  for (const query of queries) {
    await db.execute(query);
  }
}

/**
 * PostgreSQL 스키마 초기화
 */
async function initializePostgreSQL(): Promise<void> {
  const db = getDatabase();

  // PostgreSQL은 각 쿼리를 개별 실행
  const queries = [
    // 1. Workspaces 테이블
    `CREATE TABLE IF NOT EXISTS workspaces (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'`,
    `DROP TRIGGER IF EXISTS update_workspaces_timestamp ON workspaces`,
    `CREATE TRIGGER update_workspaces_timestamp 
      BEFORE UPDATE ON workspaces
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`,

    // 2. App Settings 테이블
    `CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      access_password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `DROP TRIGGER IF EXISTS update_app_settings_timestamp ON app_settings`,
    `CREATE TRIGGER update_app_settings_timestamp 
      BEFORE UPDATE ON app_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`,

    // 3. Projects 테이블
    `CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(50) PRIMARY KEY,
      workspace_id INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      start_date DATE,
      end_date DATE,
      memo TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id)`,
    `DROP TRIGGER IF EXISTS update_projects_timestamp ON projects`,
    `CREATE TRIGGER update_projects_timestamp 
      BEFORE UPDATE ON projects
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`,

    // 3-1. Vendors (거래처) 테이블 (Transactions보다 먼저 생성 필요)
    `CREATE TABLE IF NOT EXISTS vendors (
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
    )`,
    `CREATE INDEX IF NOT EXISTS idx_vendors_workspace_id ON vendors(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name)`,
    `CREATE INDEX IF NOT EXISTS idx_vendors_business_number ON vendors(business_number)`,
    `DROP TRIGGER IF EXISTS update_vendors_timestamp ON vendors`,
    `CREATE TRIGGER update_vendors_timestamp 
      BEFORE UPDATE ON vendors
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`,

    // 4. Transactions 테이블
    `CREATE TABLE IF NOT EXISTS transactions (
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
    )`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_workspace_id ON transactions(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_vendor_id ON transactions(vendor_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`,
    `DROP TRIGGER IF EXISTS update_transactions_timestamp ON transactions`,
    `CREATE TRIGGER update_transactions_timestamp 
      BEFORE UPDATE ON transactions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`,

    // 5. Transaction Receipts 테이블
    `CREATE TABLE IF NOT EXISTS transaction_receipts (
      id SERIAL PRIMARY KEY,
      transaction_id INTEGER NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      file_name VARCHAR(255),
      file_size INTEGER,
      mime_type VARCHAR(100),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_transaction_receipts_transaction_id ON transaction_receipts(transaction_id)`,

    // 6. Documents 테이블
    `CREATE TABLE IF NOT EXISTS documents (
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
    )`,
    `CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type)`,
    `CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON documents(expiry_date)`,
    `DROP TRIGGER IF EXISTS update_documents_timestamp ON documents`,
    `CREATE TRIGGER update_documents_timestamp 
      BEFORE UPDATE ON documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`,
    // 7. Comments (코멘트) 테이블
    `CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      workspace_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_comments_workspace_id ON comments(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at)`,
    `DROP TRIGGER IF EXISTS update_comments_timestamp ON comments`,
    `CREATE TRIGGER update_comments_timestamp 
      BEFORE UPDATE ON comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`,
    // 8. Comment Attachments (코멘트 첨부파일) 테이블
    `CREATE TABLE IF NOT EXISTS comment_attachments (
      id SERIAL PRIMARY KEY,
      comment_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      file_name VARCHAR(255),
      file_size INTEGER,
      mime_type VARCHAR(100),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON comment_attachments(comment_id)`,
    // 9. Todos (할일 목록) 테이블
    `CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      workspace_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      due_date DATE,
      is_completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_todos_workspace_id ON todos(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)`,
    `CREATE INDEX IF NOT EXISTS idx_todos_is_completed ON todos(is_completed)`,
    `DROP TRIGGER IF EXISTS update_todos_timestamp ON todos`,
    `CREATE TRIGGER update_todos_timestamp 
      BEFORE UPDATE ON todos
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`,
    // 10. Todo Attachments (할일 첨부파일) 테이블
    `CREATE TABLE IF NOT EXISTS todo_attachments (
      id SERIAL PRIMARY KEY,
      todo_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      file_name VARCHAR(255),
      file_size INTEGER,
      mime_type VARCHAR(100),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_todo_attachments_todo_id ON todo_attachments(todo_id)`,
    // 11. Bookmarks (URL 바로가기) 테이블
    `CREATE TABLE IF NOT EXISTS bookmarks (
      id SERIAL PRIMARY KEY,
      workspace_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_bookmarks_workspace_id ON bookmarks(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at)`,
    `DROP TRIGGER IF EXISTS update_bookmarks_timestamp ON bookmarks`,
    `CREATE TRIGGER update_bookmarks_timestamp 
      BEFORE UPDATE ON bookmarks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`,
  ];

  for (const query of queries) {
    await db.execute(query);
  }
}

/**
 * 초기 비밀번호 설정 (2906)
 */
async function initializePassword(): Promise<void> {
  const db = getDatabase();

  // 기존 설정이 있는지 확인
  const existing = await db.queryOne("SELECT id FROM app_settings WHERE id = 1");

  if (!existing) {
    // 초기 비밀번호 해시 생성
    const hashedPassword = await bcrypt.hash("2906", 10);

    // 설정 삽입
    await db.execute(
      "INSERT INTO app_settings (id, access_password) VALUES (1, $1)",
      [hashedPassword]
    );

    console.log("✅ 초기 비밀번호 설정 완료 (2906)");
  }
}

/**
 * 데이터베이스 연결 테스트
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const db = getDatabase();
    const result = await db.queryOne<{ test: number }>("SELECT 1 as test");
    return result?.test === 1;
  } catch (error) {
    console.error("❌ 데이터베이스 연결 테스트 실패:", error);
    return false;
  }
}

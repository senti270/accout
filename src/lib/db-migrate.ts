/**
 * 데이터베이스 마이그레이션 스크립트
 * 기존 데이터베이스에 vendors 테이블과 transactions.vendor_id 컬럼 추가
 */

import { getDatabase, getDatabaseType } from "./db";

/**
 * vendors 테이블과 transactions.vendor_id 컬럼 마이그레이션
 */
export async function migrateVendors(): Promise<void> {
  const dbType = getDatabaseType();
  const db = getDatabase();

  try {
    if (dbType === "turso" || dbType === "sqlite") {
      // SQLite/Turso: vendors 테이블 추가
      await db.execute(`
        CREATE TABLE IF NOT EXISTS vendors (
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
        )
      `);

      // 인덱스 추가
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_vendors_workspace_id ON vendors(workspace_id)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_vendors_business_number ON vendors(business_number)"
      );

      // 트리거 추가
      await db.execute(`
        CREATE TRIGGER IF NOT EXISTS update_vendors_timestamp 
          AFTER UPDATE ON vendors
          FOR EACH ROW
        BEGIN
          UPDATE vendors SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

      // transactions 테이블에 vendor_id 컬럼 추가 (없을 경우)
      try {
        await db.execute(
          "ALTER TABLE transactions ADD COLUMN vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL"
        );
        await db.execute(
          "CREATE INDEX IF NOT EXISTS idx_transactions_vendor_id ON transactions(vendor_id)"
        );
      } catch (error: any) {
        // 컬럼이 이미 존재하면 무시
        if (!error?.message?.includes("duplicate column")) {
          console.warn("vendor_id 컬럼 추가 실패 (이미 존재할 수 있음):", error);
        }
      }
    } else {
      // PostgreSQL: vendors 테이블 추가
      await db.execute(`
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
        )
      `);

      // 인덱스 추가
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_vendors_workspace_id ON vendors(workspace_id)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name)"
      );
      await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_vendors_business_number ON vendors(business_number)"
      );

      // 트리거 추가
      await db.execute(`
        CREATE TRIGGER update_vendors_timestamp 
          BEFORE UPDATE ON vendors
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);

      // transactions 테이블에 vendor_id 컬럼 추가 (없을 경우)
      try {
        await db.execute(
          "ALTER TABLE transactions ADD COLUMN vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL"
        );
        await db.execute(
          "CREATE INDEX IF NOT EXISTS idx_transactions_vendor_id ON transactions(vendor_id)"
        );
      } catch (error: any) {
        // 컬럼이 이미 존재하면 무시
        if (!error?.message?.includes("already exists")) {
          console.warn("vendor_id 컬럼 추가 실패 (이미 존재할 수 있음):", error);
        }
      }
    }

    console.log("✅ vendors 테이블 마이그레이션 완료");
  } catch (error) {
    console.error("❌ vendors 테이블 마이그레이션 실패:", error);
    throw error;
  }
}


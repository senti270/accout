/**
 * vendors 테이블에 은행 정보 및 사업자등록증 파일 필드 추가
 */

import { getDatabase, getDatabaseType } from "./db";

/**
 * vendors 테이블에 bank_code, bank_account, business_certificate_file_url 등 컬럼 추가
 */
export async function migrateVendorFields(): Promise<void> {
  const dbType = getDatabaseType();
  const db = getDatabase();

  try {
    if (dbType === "turso" || dbType === "sqlite") {
      // SQLite/Turso: vendors 테이블에 컬럼 추가
      const columns = [
        { name: "bank_code", type: "VARCHAR(10)" },
        { name: "bank_account", type: "VARCHAR(100)" },
        { name: "business_certificate_file_url", type: "TEXT" },
        { name: "business_certificate_file_name", type: "VARCHAR(255)" },
        { name: "business_certificate_file_size", type: "INTEGER" },
        { name: "business_certificate_mime_type", type: "VARCHAR(100)" },
      ];

      for (const column of columns) {
        try {
          // SQLite는 PRAGMA로 컬럼 존재 여부 확인
          const tableInfo = await db.query<{ name: string }>(
            "PRAGMA table_info(vendors)"
          );
          const exists = tableInfo.some((col) => col.name === column.name);

          if (!exists) {
            await db.execute(
              `ALTER TABLE vendors ADD COLUMN ${column.name} ${column.type}`
            );
            console.log(`✅ vendors.${column.name} 컬럼 추가 완료`);
          } else {
            console.log(`ℹ️ vendors.${column.name} 컬럼이 이미 존재합니다`);
          }
        } catch (error: any) {
          if (!error?.message?.includes("duplicate column")) {
            console.warn(
              `vendors.${column.name} 컬럼 추가 실패 (이미 존재할 수 있음):`,
              error
            );
          }
        }
      }
    } else {
      // PostgreSQL: vendors 테이블에 컬럼 추가
      const columns = [
        { name: "bank_code", type: "VARCHAR(10)" },
        { name: "bank_account", type: "VARCHAR(100)" },
        { name: "business_certificate_file_url", type: "TEXT" },
        { name: "business_certificate_file_name", type: "VARCHAR(255)" },
        { name: "business_certificate_file_size", type: "INTEGER" },
        { name: "business_certificate_mime_type", type: "VARCHAR(100)" },
      ];

      for (const column of columns) {
        try {
          // PostgreSQL에서 컬럼 존재 여부 확인
          const columnExists = await db.queryOne<{ exists: boolean }>(
            `SELECT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'vendors' 
              AND column_name = $1
            ) as exists`,
            [column.name]
          );

          if (!columnExists?.exists) {
            await db.execute(
              `ALTER TABLE vendors ADD COLUMN ${column.name} ${column.type}`
            );
            console.log(`✅ vendors.${column.name} 컬럼 추가 완료`);
          } else {
            console.log(`ℹ️ vendors.${column.name} 컬럼이 이미 존재합니다`);
          }
        } catch (error: any) {
          if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate column")) {
            console.warn(
              `vendors.${column.name} 컬럼 추가 실패 (이미 존재할 수 있음):`,
              error
            );
          }
        }
      }
    }

    console.log("✅ vendors 테이블 필드 마이그레이션 완료");
  } catch (error) {
    console.error("❌ vendors 테이블 필드 마이그레이션 실패:", error);
    throw error;
  }
}


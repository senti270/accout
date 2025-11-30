/**
 * description 컬럼 마이그레이션 스크립트
 * 기존 transactions 테이블에 description 컬럼 추가
 */

import { getDatabase, getDatabaseType } from "./db";

/**
 * transactions.description 컬럼 마이그레이션
 */
export async function migrateDescription(): Promise<void> {
  const dbType = getDatabaseType();
  const db = getDatabase();

  try {
    if (dbType === "turso" || dbType === "sqlite") {
      // SQLite/Turso: description 컬럼 추가
      try {
        // 먼저 컬럼이 존재하는지 확인
        const tableInfo = await db.query<{ name: string }>(
          "PRAGMA table_info(transactions)"
        );
        const hasDescription = tableInfo.some(
          (col) => col.name === "description"
        );

        if (!hasDescription) {
          await db.execute(
            "ALTER TABLE transactions ADD COLUMN description TEXT"
          );
          console.log("✅ transactions.description 컬럼 추가 완료");
        } else {
          console.log("ℹ️ transactions.description 컬럼이 이미 존재합니다");
        }
      } catch (error: any) {
        if (
          !error?.message?.includes("duplicate column") &&
          !error?.message?.includes("already exists")
        ) {
          console.warn(
            "description 컬럼 추가 실패 (이미 존재할 수 있음):",
            error
          );
        }
      }
    } else {
      // PostgreSQL: description 컬럼 추가
      try {
        const columnExists = await db.queryOne<{ exists: boolean }>(
          `SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            AND column_name = 'description'
          ) as exists`
        );

        if (!columnExists?.exists) {
          await db.execute(
            "ALTER TABLE transactions ADD COLUMN description TEXT"
          );
          console.log("✅ transactions.description 컬럼 추가 완료");
        } else {
          console.log("ℹ️ transactions.description 컬럼이 이미 존재합니다");
        }
      } catch (error: any) {
        if (
          !error?.message?.includes("already exists") &&
          !error?.message?.includes("duplicate column")
        ) {
          console.warn(
            "description 컬럼 추가 실패 (이미 존재할 수 있음):",
            error
          );
        }
      }
    }

    console.log("✅ description 컬럼 마이그레이션 완료");
  } catch (error) {
    console.error("❌ description 컬럼 마이그레이션 실패:", error);
    throw error;
  }
}


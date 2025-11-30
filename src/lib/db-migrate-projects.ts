/**
 * 프로젝트 서류 마이그레이션 스크립트
 * documents 테이블에 project_id 컬럼 추가
 */

import { getDatabase, getDatabaseType } from "./db";

/**
 * documents 테이블에 project_id 컬럼 마이그레이션
 */
export async function migrateProjectDocuments(): Promise<void> {
  const dbType = getDatabaseType();
  const db = getDatabase();

  try {
    if (dbType === "turso" || dbType === "sqlite") {
      // SQLite/Turso: project_id 컬럼 추가
      try {
        // 컬럼이 이미 존재하는지 확인
        const tableInfo = await db.query<{ name: string }>(
          "PRAGMA table_info(documents)"
        );
        const hasProjectId = tableInfo.some((col) => col.name === "project_id");

        if (!hasProjectId) {
          // 컬럼 추가
          await db.execute(
            "ALTER TABLE documents ADD COLUMN project_id VARCHAR(50)"
          );
          await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id)"
          );
          console.log("✅ documents.project_id 컬럼 추가 완료");
        } else {
          console.log("ℹ️ documents.project_id 컬럼이 이미 존재합니다");
        }
      } catch (error: any) {
        // 컬럼이 이미 존재하면 무시
        if (!error?.message?.includes("duplicate column") && !error?.message?.includes("already exists")) {
          console.warn("project_id 컬럼 추가 실패 (이미 존재할 수 있음):", error);
        }
      }
    } else {
      // PostgreSQL: project_id 컬럼 추가
      try {
        // 컬럼 존재 여부 확인
        const columnExists = await db.queryOne<{ exists: boolean }>(
          `SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'documents' 
            AND column_name = 'project_id'
          ) as exists`
        );

        if (!columnExists?.exists) {
          await db.execute(
            "ALTER TABLE documents ADD COLUMN project_id VARCHAR(50)"
          );
          await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id)"
          );
          console.log("✅ documents.project_id 컬럼 추가 완료");
        } else {
          console.log("ℹ️ documents.project_id 컬럼이 이미 존재합니다");
        }
      } catch (error: any) {
        // 컬럼이 이미 존재하면 무시
        if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate column")) {
          console.warn("project_id 컬럼 추가 실패 (이미 존재할 수 있음):", error);
        }
      }
    }

    console.log("✅ 프로젝트 서류 마이그레이션 완료");
  } catch (error) {
    console.error("❌ 프로젝트 서류 마이그레이션 실패:", error);
    throw error;
  }
}


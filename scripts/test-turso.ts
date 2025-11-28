/**
 * Turso 연결 테스트 스크립트
 */

import { getDatabase, getDatabaseType } from "../src/lib/db";

async function test() {
  console.log("🔍 데이터베이스 타입:", getDatabaseType());
  console.log("🔍 환경 변수 확인:");
  console.log("  TURSO_DATABASE_URL:", process.env.TURSO_DATABASE_URL ? "✅ 설정됨" : "❌ 없음");
  console.log("  TURSO_AUTH_TOKEN:", process.env.TURSO_AUTH_TOKEN ? "✅ 설정됨" : "❌ 없음");
  
  try {
    const db = getDatabase();
    const result = await db.queryOne<{ test: number }>("SELECT 1 as test");
    console.log("✅ 연결 성공:", result);
    
    // 테이블 목록 확인
    const tables = await db.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    console.log("📋 생성된 테이블:", tables.map(t => t.name));
  } catch (error) {
    console.error("❌ 연결 실패:", error);
  }
}

test();


/**
 * 데이터베이스 초기화 스크립트
 * 
 * 사용법: npx tsx scripts/init-db.ts
 * 또는: npm run init-db
 */

import { initializeDatabase, testDatabaseConnection } from "../src/lib/db-init";

async function main() {
  console.log("🚀 데이터베이스 초기화 시작...\n");

  try {
    // 데이터베이스 연결 테스트
    if (!testDatabaseConnection()) {
      throw new Error("데이터베이스 연결 실패");
    }
    console.log("✅ 데이터베이스 연결 성공\n");

    // 스키마 초기화
    await initializeDatabase();

    console.log("\n✨ 데이터베이스 초기화가 완료되었습니다!");
    console.log("📁 데이터베이스 파일 위치: data/account.db");
  } catch (error) {
    console.error("\n❌ 초기화 중 오류 발생:", error);
    process.exit(1);
  }
}

main();


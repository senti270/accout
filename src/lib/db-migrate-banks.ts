/**
 * 은행 코드 테이블 생성 및 데이터 삽입
 */

import { getDatabase, getDatabaseType } from "./db";

const BANK_DATA = [
  { code: "001", name: "한국은행" },
  { code: "002", name: "산업은행" },
  { code: "003", name: "기업은행" },
  { code: "004", name: "국민은행" },
  { code: "005", name: "외환은행" },
  { code: "007", name: "수협은행" },
  { code: "020", name: "우리은행" },
  { code: "023", name: "SC제일은행" },
  { code: "011", name: "농협은행" },
  { code: "081", name: "하나은행" },
  { code: "037", name: "전북은행" },
  { code: "032", name: "부산은행" },
  { code: "039", name: "경남은행" },
  { code: "031", name: "대구은행" },
  { code: "035", name: "제주은행" },
  { code: "088", name: "신한은행" },
  { code: "071", name: "우체국" },
];

/**
 * 은행 코드 테이블 생성 및 데이터 삽입
 */
export async function migrateBanks(): Promise<void> {
  const dbType = getDatabaseType();
  const db = getDatabase();

  try {
    if (dbType === "turso" || dbType === "sqlite") {
      // SQLite/Turso: 은행 코드 테이블 생성
      await db.execute(`
        CREATE TABLE IF NOT EXISTS bank_codes (
          code VARCHAR(10) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 은행 데이터 삽입 (이미 존재하면 무시)
      for (const bank of BANK_DATA) {
        await db.execute(
          "INSERT OR IGNORE INTO bank_codes (code, name) VALUES ($1, $2)",
          [bank.code, bank.name]
        );
      }
    } else {
      // PostgreSQL: 은행 코드 테이블 생성
      await db.execute(`
        CREATE TABLE IF NOT EXISTS bank_codes (
          code VARCHAR(10) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 은행 데이터 삽입 (이미 존재하면 무시)
      for (const bank of BANK_DATA) {
        await db.execute(
          "INSERT INTO bank_codes (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING",
          [bank.code, bank.name]
        );
      }
    }

    console.log("✅ 은행 코드 테이블 생성 및 데이터 삽입 완료");
  } catch (error) {
    console.error("❌ 은행 코드 테이블 생성 실패:", error);
    throw error;
  }
}


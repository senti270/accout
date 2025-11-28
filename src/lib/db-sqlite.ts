/**
 * SQLite 데이터베이스 연결 (로컬 개발용)
 */

import Database from "better-sqlite3";
import path from "path";
import { existsSync, mkdirSync } from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "account.db");

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: Database.Database | null = null;

export function getSQLiteDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma("journal_mode = WAL");
    dbInstance.pragma("foreign_keys = ON");
    
    process.on("exit", () => {
      if (dbInstance) {
        dbInstance.close();
      }
    });
  }
  
  return dbInstance;
}

export function closeSQLiteDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function sqliteTransaction<T>(callback: (db: Database.Database) => T): T {
  const db = getSQLiteDatabase();
  const transaction = db.transaction(callback);
  return transaction();
}


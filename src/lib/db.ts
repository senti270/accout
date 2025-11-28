/**
 * 데이터베이스 연결 추상화
 * 환경 변수에 따라 Turso > PostgreSQL > SQLite 순으로 선택
 * 
 * 우선순위:
 * 1. TURSO_DATABASE_URL → Turso (SQLite 호환, Vercel 추천)
 * 2. DATABASE_URL → PostgreSQL
 * 3. 없음 → 로컬 SQLite
 */

// 환경 변수 확인
const USE_TURSO = !!process.env.TURSO_DATABASE_URL;
const USE_POSTGRES = !!process.env.DATABASE_URL && !USE_TURSO;
const DB_TYPE = USE_TURSO ? "turso" : USE_POSTGRES ? "postgres" : "sqlite";

// SQLite용 타입
import type Database from "better-sqlite3";

// 공통 인터페이스
export interface DatabaseAdapter {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<{ rowCount: number }>;
}

// SQLite 어댑터 (로컬)
class SQLiteAdapter implements DatabaseAdapter {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const rows = params ? stmt.all(...params) : stmt.all();
    return rows as T[];
  }

  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const row = params ? stmt.get(...params) : stmt.get();
    return (row as T) || null;
  }

  async execute(sql: string, params?: unknown[]): Promise<{ rowCount: number }> {
    const stmt = this.db.prepare(sql);
    const result = params ? stmt.run(...params) : stmt.run();
    return { rowCount: result.changes || 0 };
  }
}

// Turso 어댑터 (SQLite 호환, Vercel 추천)
class TursoAdapter implements DatabaseAdapter {
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const { query } = await import("./db-turso");
    return await query<T>(sql, params);
  }

  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    const { queryOne } = await import("./db-turso");
    return await queryOne<T>(sql, params);
  }

  async execute(sql: string, params?: unknown[]): Promise<{ rowCount: number }> {
    const { execute } = await import("./db-turso");
    return await execute(sql, params);
  }
}

// PostgreSQL 어댑터
class PostgresAdapter implements DatabaseAdapter {
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const { query } = await import("./db-postgres");
    return await query<T>(sql, params);
  }

  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    const { queryOne } = await import("./db-postgres");
    return await queryOne<T>(sql, params);
  }

  async execute(sql: string, params?: unknown[]): Promise<{ rowCount: number }> {
    const { execute } = await import("./db-postgres");
    return await execute(sql, params);
  }
}

// 싱글톤 인스턴스
let adapterInstance: DatabaseAdapter | null = null;

/**
 * 데이터베이스 어댑터 가져오기
 */
export function getDatabase(): DatabaseAdapter {
  if (!adapterInstance) {
    if (USE_TURSO) {
      adapterInstance = new TursoAdapter();
    } else if (USE_POSTGRES) {
      adapterInstance = new PostgresAdapter();
    } else {
      const { getSQLiteDatabase } = require("./db-sqlite");
      const db = getSQLiteDatabase();
      adapterInstance = new SQLiteAdapter(db);
    }
  }
  return adapterInstance;
}

/**
 * 직접 SQLite 데이터베이스 인스턴스 가져오기 (초기화 등 특수한 경우)
 */
export function getSQLiteDatabase(): Database.Database | null {
  if (USE_TURSO || USE_POSTGRES) {
    return null;
  }
  const { getSQLiteDatabase: getSQLite } = require("./db-sqlite");
  return getSQLite();
}

/**
 * 데이터베이스 타입 확인
 */
export function getDatabaseType(): "sqlite" | "turso" | "postgres" {
  return DB_TYPE;
}

// 기본 export
export default getDatabase;

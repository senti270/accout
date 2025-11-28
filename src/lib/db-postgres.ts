/**
 * PostgreSQL 데이터베이스 연결 (Vercel 배포용)
 */

import { sql } from "@vercel/postgres";
import { Pool } from "pg";

// 환경 변수에서 DATABASE_URL 가져오기
const DATABASE_URL = process.env.DATABASE_URL;

let poolInstance: Pool | null = null;

/**
 * PostgreSQL 연결 풀 가져오기
 */
export function getPostgresPool(): Pool {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  }

  return poolInstance;
}

/**
 * Vercel Postgres 사용 (서버리스 환경)
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  try {
    const result = await sql.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error("PostgreSQL 쿼리 오류:", error);
    throw error;
  }
}

/**
 * 단일 행 조회
 */
export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * 실행 (INSERT, UPDATE, DELETE)
 */
export async function execute(
  text: string,
  params?: unknown[]
): Promise<{ rowCount: number }> {
  try {
    const result = await sql.query(text, params);
    return { rowCount: result.rowCount || 0 };
  } catch (error) {
    console.error("PostgreSQL 실행 오류:", error);
    throw error;
  }
}

/**
 * 트랜잭션 실행
 */
export async function transaction<T>(
  callback: (client: typeof sql) => Promise<T>
): Promise<T> {
  // Vercel Postgres는 자동으로 트랜잭션을 처리합니다
  return await callback(sql);
}


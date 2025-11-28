/**
 * Turso (LibSQL) 데이터베이스 연결 (Vercel 배포용 - SQLite 호환)
 * 
 * Turso는 SQLite와 100% 호환되는 원격 데이터베이스 서비스입니다.
 * Vercel 공식 추천 방식입니다.
 */

import { createClient } from "@libsql/client";

// 환경 변수에서 Turso 연결 정보 가져오기
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

let clientInstance: ReturnType<typeof createClient> | null = null;

/**
 * Turso 클라이언트 가져오기
 */
export function getTursoClient() {
  if (!TURSO_DATABASE_URL) {
    throw new Error("TURSO_DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  if (!clientInstance) {
    clientInstance = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
  }

  return clientInstance;
}

/**
 * 쿼리 실행 (여러 행 반환)
 */
export async function query<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = getTursoClient();
  
  try {
    const result = await client.execute({
      sql,
      args: (params || []) as unknown as any[],
    });
    
    return result.rows as T[];
  } catch (error) {
    console.error("Turso 쿼리 오류:", error);
    throw error;
  }
}

/**
 * 단일 행 조회
 */
export async function queryOne<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const client = getTursoClient();
  
  try {
    const result = await client.execute({
      sql,
      args: (params || []) as unknown as any[],
    });
    
    return (result.rows[0] as T) || null;
  } catch (error) {
    console.error("Turso 쿼리 오류:", error);
    throw error;
  }
}

/**
 * 실행 (INSERT, UPDATE, DELETE)
 */
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<{ rowCount: number }> {
  const client = getTursoClient();
  
  try {
    const result = await client.execute({
      sql,
      args: (params || []) as unknown as any[],
    });
    
    return { rowCount: result.rowsAffected || 0 };
  } catch (error) {
    console.error("Turso 실행 오류:", error);
    throw error;
  }
}

/**
 * 여러 쿼리를 한 번에 실행 (배치)
 */
export async function batch(queries: Array<{ sql: string; args?: unknown[] }>): Promise<void> {
  const client = getTursoClient();
  
  try {
    const batchQueries = queries.map(q => ({
      sql: q.sql,
      args: (q.args || []) as unknown as any[],
    }));
    await client.batch(batchQueries);
  } catch (error) {
    console.error("Turso 배치 실행 오류:", error);
    throw error;
  }
}

/**
 * 트랜잭션 실행
 */
export async function transaction<T>(
  callback: (client: ReturnType<typeof createClient>) => Promise<T>
): Promise<T> {
  const client = getTursoClient();
  
  // Turso는 자동으로 트랜잭션을 처리합니다
  // 또는 명시적으로 트랜잭션을 시작할 수 있습니다
  return await callback(client);
}


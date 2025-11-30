/**
 * description 컬럼 마이그레이션 API
 * 기존 데이터베이스에 transactions.description 컬럼 추가
 */

import { migrateDescription } from "@/lib/db-migrate-description";
import { NextRequest, NextResponse } from "next/server";

async function handleMigrate(request: NextRequest) {
  try {
    // 보안: 프로덕션에서는 인증 추가 권장
    if (process.env.NODE_ENV === "production") {
      const authHeader = request.headers.get("authorization");
      const expectedToken = process.env.MIGRATE_DB_TOKEN || process.env.INIT_DB_TOKEN;

      if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json(
          { success: false, message: "인증 실패" },
          { status: 401 }
        );
      }
    }

    await migrateDescription();
    return NextResponse.json({
      success: true,
      message: "transactions.description 컬럼 마이그레이션 완료",
    });
  } catch (error) {
    console.error("description 컬럼 마이그레이션 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET 요청 허용 (브라우저에서 직접 접속 가능)
export async function GET(request: NextRequest) {
  return handleMigrate(request);
}

// POST 요청 허용
export async function POST(request: NextRequest) {
  return handleMigrate(request);
}


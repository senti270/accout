import { migrateBanks } from "@/lib/db-migrate-banks";
import { NextRequest, NextResponse } from "next/server";

async function handleMigrate(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production") {
      const authHeader = request.headers.get("authorization");
      const expectedToken = process.env.MIGRATE_DB_TOKEN;

      if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json(
          { success: false, message: "인증 실패" },
          { status: 401 }
        );
      }
    }

    await migrateBanks();
    return NextResponse.json({
      success: true,
      message: "은행 코드 테이블 생성 및 데이터 삽입 완료",
    });
  } catch (error) {
    console.error("은행 코드 마이그레이션 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleMigrate(request);
}

export async function POST(request: NextRequest) {
  return handleMigrate(request);
}


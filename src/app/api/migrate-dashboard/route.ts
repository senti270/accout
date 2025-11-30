/**
 * 대시보드 테이블 마이그레이션 API
 * 기존 데이터베이스에 comments, todos, bookmarks 테이블 추가
 * GET 또는 POST 요청 모두 허용
 */

import { migrateDashboardTables } from "@/lib/db-migrate-dashboard";
import { NextRequest, NextResponse } from "next/server";

async function handleMigrate(request: NextRequest) {
  try {
    // 보안: 프로덕션에서는 인증 추가 권장
    if (process.env.NODE_ENV === "production") {
      const authHeader = request.headers.get("authorization");
      const expectedToken = process.env.MIGRATE_DB_TOKEN; // .env에 설정 필요

      if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json(
          { success: false, message: "인증 실패" },
          { status: 401 }
        );
      }
    }

    await migrateDashboardTables();
    return NextResponse.json({
      success: true,
      message: "대시보드 테이블 마이그레이션 완료 (comments, todos, bookmarks)",
    });
  } catch (error) {
    console.error("대시보드 테이블 마이그레이션 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "대시보드 테이블 마이그레이션 실패",
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


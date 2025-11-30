/**
 * 프로젝트 서류 마이그레이션 API
 * documents 테이블에 project_id 컬럼 추가
 * GET 또는 POST 요청 모두 허용
 */

import { migrateProjectDocuments } from "@/lib/db-migrate-projects";
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

    await migrateProjectDocuments();
    return NextResponse.json({
      success: true,
      message: "documents.project_id 컬럼 마이그레이션 완료",
    });
  } catch (error) {
    console.error("프로젝트 서류 마이그레이션 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "프로젝트 서류 마이그레이션 실패",
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


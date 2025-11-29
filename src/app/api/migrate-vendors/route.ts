/**
 * vendors 테이블 마이그레이션 API
 * 기존 데이터베이스에 vendors 테이블 추가
 */

import { migrateVendors } from "@/lib/db-migrate";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return handleMigrate(request);
}

export async function POST(request: NextRequest) {
  return handleMigrate(request);
}

async function handleMigrate(request: NextRequest) {
  try {
    // 보안: 프로덕션에서는 인증 추가 권장
    if (process.env.NODE_ENV === "production") {
      const authHeader = request.headers.get("authorization");
      const expectedToken = process.env.INIT_DB_TOKEN;
      
      if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json(
          { success: false, message: "인증 실패" },
          { status: 401 }
        );
      }
    }

    await migrateVendors();
    return NextResponse.json({ 
      success: true, 
      message: "vendors 테이블 마이그레이션 완료" 
    });
  } catch (error) {
    console.error("마이그레이션 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "마이그레이션 실패" 
      },
      { status: 500 }
    );
  }
}


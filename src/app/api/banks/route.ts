/**
 * 은행 코드 API
 * GET: 은행 코드 목록 조회
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 은행 코드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();

    const banks = await db.query<{
      code: string;
      name: string;
    }>("SELECT code, name FROM bank_codes ORDER BY name");

    return NextResponse.json({ success: true, data: banks });
  } catch (error: any) {
    console.error("은행 코드 조회 오류:", error);
    const errorMessage = error?.message || "은행 코드 조회에 실패했습니다.";
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage.includes("no such table") || errorMessage.includes("does not exist")
          ? "은행 코드 테이블이 없습니다. /api/init-db 또는 /api/migrate-banks를 실행해주세요."
          : errorMessage
      },
      { status: 500 }
    );
  }
}


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
      created_at: string;
    }>("SELECT * FROM bank_codes ORDER BY code");

    return NextResponse.json({ success: true, data: banks });
  } catch (error) {
    console.error("은행 코드 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "은행 코드 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}


/**
 * 데이터베이스 초기화 API
 * 배포 후 한 번만 실행하면 됩니다
 */

import { initializeDatabase } from "@/lib/db-init";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

    await initializeDatabase();
    return NextResponse.json({ 
      success: true, 
      message: "데이터베이스 초기화 완료" 
    });
  } catch (error) {
    console.error("초기화 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "초기화 실패" 
      },
      { status: 500 }
    );
  }
}


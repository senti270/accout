/**
 * 최근 사용 카테고리 조회 API
 * 워크스페이스의 입출금 내역에서 최근에 사용된 카테고리를 반환
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspace_id");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 최근 사용된 카테고리 조회 (중복 제거, 최신순)
    const recentCategories = await db.query<{
      category: string;
      last_used: string;
    }>(
      `SELECT DISTINCT 
        category,
        MAX(created_at) as last_used
      FROM transactions
      WHERE workspace_id = $1 
        AND category IS NOT NULL
        AND category != ''
      GROUP BY category
      ORDER BY last_used DESC
      LIMIT $2`,
      [parseInt(workspaceId), limit]
    );

    return NextResponse.json({
      success: true,
      data: recentCategories.map((rc) => rc.category),
    });
  } catch (error) {
    console.error("최근 사용 카테고리 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "최근 사용 카테고리 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}


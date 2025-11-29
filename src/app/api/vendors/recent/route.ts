/**
 * 최근 사용 거래처 조회 API
 * 워크스페이스의 입출금 내역에서 최근에 사용된 거래처를 반환
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

    // 최근 사용된 거래처 조회 (중복 제거, 최신순)
    const recentVendors = await db.query<{
      vendor_id: number;
      vendor_name: string;
      last_used: string;
    }>(
      `SELECT DISTINCT 
        t.vendor_id,
        v.name as vendor_name,
        MAX(t.created_at) as last_used
      FROM transactions t
      INNER JOIN vendors v ON t.vendor_id = v.id
      WHERE t.workspace_id = $1 
        AND t.vendor_id IS NOT NULL
      GROUP BY t.vendor_id, v.name
      ORDER BY last_used DESC
      LIMIT $2`,
      [parseInt(workspaceId), limit]
    );

    return NextResponse.json({
      success: true,
      data: recentVendors.map((rv) => ({
        id: rv.vendor_id,
        name: rv.vendor_name,
      })),
    });
  } catch (error: any) {
    console.error("최근 사용 거래처 조회 오류:", error);
    // vendor_id 컬럼이 없는 경우 빈 배열 반환
    if (error?.message?.includes("no such column: vendor_id")) {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json(
      { success: false, message: "최근 사용 거래처 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}


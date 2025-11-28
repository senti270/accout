/**
 * 워크스페이스 API
 * GET: 목록 조회
 * POST: 생성
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 워크스페이스 목록 조회
export async function GET() {
  try {
    const db = getDatabase();
    const workspaces = await db.query<{
      id: number;
      name: string;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM workspaces ORDER BY created_at DESC");

    return NextResponse.json({ success: true, data: workspaces });
  } catch (error) {
    console.error("워크스페이스 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "워크스페이스 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST: 워크스페이스 생성
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "워크스페이스 이름을 입력해주세요." },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    // 중복 확인
    const existing = await db.queryOne<{ id: number }>(
      "SELECT id FROM workspaces WHERE name = $1",
      [name.trim()]
    );

    if (existing) {
      return NextResponse.json(
        { success: false, message: "이미 존재하는 워크스페이스 이름입니다." },
        { status: 400 }
      );
    }

    // 생성
    const result = await db.execute(
      "INSERT INTO workspaces (name) VALUES ($1)",
      [name.trim()]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 생성된 워크스페이스 조회
    const workspace = await db.queryOne<{
      id: number;
      name: string;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM workspaces WHERE name = $1", [name.trim()]);

    return NextResponse.json(
      { success: true, message: "워크스페이스가 생성되었습니다.", data: workspace },
      { status: 201 }
    );
  } catch (error) {
    console.error("워크스페이스 생성 오류:", error);
    return NextResponse.json(
      { success: false, message: "워크스페이스 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}


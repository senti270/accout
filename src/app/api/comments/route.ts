/**
 * 코멘트 API
 * GET: 목록 조회
 * POST: 생성
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 코멘트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspace_id");

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    const comments = await db.query<{
      id: number;
      workspace_id: number;
      content: string;
      created_at: string;
      updated_at: string;
    }>(
      "SELECT * FROM comments WHERE workspace_id = $1 ORDER BY created_at DESC",
      [parseInt(workspaceId)]
    );

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("코멘트 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "코멘트 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST: 코멘트 생성
export async function POST(request: NextRequest) {
  try {
    const { workspace_id, content } = await request.json();

    if (!workspace_id) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { success: false, message: "코멘트 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 워크스페이스 존재 확인
    const workspace = await db.queryOne<{ id: number }>(
      "SELECT id FROM workspaces WHERE id = $1",
      [workspace_id]
    );

    if (!workspace) {
      return NextResponse.json(
        { success: false, message: "워크스페이스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 생성
    const result = await db.execute(
      "INSERT INTO comments (workspace_id, content) VALUES ($1, $2)",
      [workspace_id, content.trim()]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "코멘트 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 생성된 코멘트 조회
    const comment = await db.queryOne<{
      id: number;
      workspace_id: number;
      content: string;
      created_at: string;
      updated_at: string;
    }>(
      "SELECT * FROM comments WHERE workspace_id = $1 ORDER BY id DESC LIMIT 1",
      [workspace_id]
    );

    return NextResponse.json(
      { success: true, message: "코멘트가 생성되었습니다.", data: comment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("코멘트 생성 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "코멘트 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}


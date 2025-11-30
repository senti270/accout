/**
 * Todolist API
 * GET: 목록 조회
 * POST: 생성
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Todolist 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspace_id");
    const completed = searchParams.get("completed"); // "true", "false", null (all)

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    let sql = "SELECT * FROM todos WHERE workspace_id = $1";
    const params: unknown[] = [parseInt(workspaceId)];
    let paramIndex = 2;

    if (completed === "true") {
      sql += ` AND is_completed = $${paramIndex++}`;
      params.push(1);
    } else if (completed === "false") {
      sql += ` AND is_completed = $${paramIndex++}`;
      params.push(0);
    }

    sql += " ORDER BY due_date ASC, created_at DESC";

    const todos = await db.query<{
      id: number;
      workspace_id: number;
      title: string;
      content: string | null;
      due_date: string | null;
      is_completed: number | boolean;
      created_at: string;
      updated_at: string;
    }>(sql, params);

    return NextResponse.json({ success: true, data: todos });
  } catch (error) {
    console.error("Todolist 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "Todolist 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST: Todolist 생성
export async function POST(request: NextRequest) {
  try {
    const { workspace_id, title, content, due_date } = await request.json();

    if (!workspace_id) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { success: false, message: "제목을 입력해주세요." },
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
      "INSERT INTO todos (workspace_id, title, content, due_date, is_completed) VALUES ($1, $2, $3, $4, $5)",
      [
        workspace_id,
        title.trim(),
        content?.trim() || null,
        due_date || null,
        0, // 기본값: 미완료
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "할일 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 생성된 할일 조회
    const todo = await db.queryOne<{
      id: number;
      workspace_id: number;
      title: string;
      content: string | null;
      due_date: string | null;
      is_completed: number | boolean;
      created_at: string;
      updated_at: string;
    }>(
      "SELECT * FROM todos WHERE workspace_id = $1 ORDER BY id DESC LIMIT 1",
      [workspace_id]
    );

    return NextResponse.json(
      { success: true, message: "할일이 생성되었습니다.", data: todo },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Todolist 생성 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "할일 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}


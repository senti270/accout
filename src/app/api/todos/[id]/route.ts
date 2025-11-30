/**
 * Todolist 상세 API
 * GET: 단일 조회
 * PUT: 수정
 * DELETE: 삭제
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Todolist 단일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const todoId = parseInt(id);

    if (isNaN(todoId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 할일 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    const todo = await db.queryOne<{
      id: number;
      workspace_id: number;
      title: string;
      content: string | null;
      due_date: string | null;
      is_completed: number | boolean;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM todos WHERE id = $1", [todoId]);

    if (!todo) {
      return NextResponse.json(
        { success: false, message: "할일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    console.error("Todolist 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "할일 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT: Todolist 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const todoId = parseInt(id);
    const { title, content, due_date, is_completed } = await request.json();

    if (isNaN(todoId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 할일 ID입니다." },
        { status: 400 }
      );
    }

    if (title !== undefined && (!title || title.trim() === "")) {
      return NextResponse.json(
        { success: false, message: "제목을 입력해주세요." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 할일 존재 확인
    const existingTodo = await db.queryOne<{ id: number }>(
      "SELECT id FROM todos WHERE id = $1",
      [todoId]
    );

    if (!existingTodo) {
      return NextResponse.json(
        { success: false, message: "할일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 업데이트할 필드 구성
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(title.trim());
    }
    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      params.push(content?.trim() || null);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      params.push(due_date || null);
    }
    if (is_completed !== undefined) {
      updates.push(`is_completed = $${paramIndex++}`);
      params.push(is_completed ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "수정할 내용이 없습니다." },
        { status: 400 }
      );
    }

    params.push(todoId);
    const sql = `UPDATE todos SET ${updates.join(", ")} WHERE id = $${paramIndex}`;

    // 수정
    const result = await db.execute(sql, params);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "할일 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    // 수정된 할일 조회
    const todo = await db.queryOne<{
      id: number;
      workspace_id: number;
      title: string;
      content: string | null;
      due_date: string | null;
      is_completed: number | boolean;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM todos WHERE id = $1", [todoId]);

    return NextResponse.json({
      success: true,
      message: "할일이 수정되었습니다.",
      data: todo,
    });
  } catch (error: any) {
    console.error("Todolist 수정 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "할일 수정에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

// DELETE: Todolist 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const todoId = parseInt(id);

    if (isNaN(todoId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 할일 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 할일 존재 확인
    const existingTodo = await db.queryOne<{ id: number }>(
      "SELECT id FROM todos WHERE id = $1",
      [todoId]
    );

    if (!existingTodo) {
      return NextResponse.json(
        { success: false, message: "할일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제 (CASCADE로 첨부파일도 자동 삭제)
    const result = await db.execute("DELETE FROM todos WHERE id = $1", [
      todoId,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "할일 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "할일이 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("Todolist 삭제 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "할일 삭제에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}


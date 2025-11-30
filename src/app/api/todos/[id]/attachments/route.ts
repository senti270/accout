/**
 * Todolist 첨부파일 API
 * GET: 첨부파일 목록 조회
 * POST: 첨부파일 추가
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Todolist 첨부파일 목록 조회
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

    const attachments = await db.query<{
      id: number;
      todo_id: number;
      image_url: string;
      file_name: string | null;
      file_size: number | null;
      mime_type: string | null;
      created_at: string;
    }>(
      "SELECT * FROM todo_attachments WHERE todo_id = $1 ORDER BY created_at ASC",
      [todoId]
    );

    return NextResponse.json({ success: true, data: attachments });
  } catch (error) {
    console.error("Todolist 첨부파일 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "첨부파일 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST: Todolist 첨부파일 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const todoId = parseInt(id);
    const { image_url, file_name, file_size, mime_type } = await request.json();

    if (isNaN(todoId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 할일 ID입니다." },
        { status: 400 }
      );
    }

    if (!image_url || image_url.trim() === "") {
      return NextResponse.json(
        { success: false, message: "이미지 URL을 입력해주세요." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 할일 존재 확인
    const todo = await db.queryOne<{ id: number }>(
      "SELECT id FROM todos WHERE id = $1",
      [todoId]
    );

    if (!todo) {
      return NextResponse.json(
        { success: false, message: "할일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 첨부파일 추가
    const result = await db.execute(
      "INSERT INTO todo_attachments (todo_id, image_url, file_name, file_size, mime_type) VALUES ($1, $2, $3, $4, $5)",
      [
        todoId,
        image_url.trim(),
        file_name || null,
        file_size || null,
        mime_type || null,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "첨부파일 추가에 실패했습니다." },
        { status: 500 }
      );
    }

    // 추가된 첨부파일 조회
    const attachment = await db.queryOne<{
      id: number;
      todo_id: number;
      image_url: string;
      file_name: string | null;
      file_size: number | null;
      mime_type: string | null;
      created_at: string;
    }>(
      "SELECT * FROM todo_attachments WHERE todo_id = $1 ORDER BY id DESC LIMIT 1",
      [todoId]
    );

    return NextResponse.json(
      { success: true, message: "첨부파일이 추가되었습니다.", data: attachment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Todolist 첨부파일 추가 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "첨부파일 추가에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}


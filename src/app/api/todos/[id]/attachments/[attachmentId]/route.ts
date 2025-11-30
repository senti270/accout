/**
 * Todolist 첨부파일 삭제 API
 * DELETE: 첨부파일 삭제
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// DELETE: Todolist 첨부파일 삭제
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { id, attachmentId } = await params;
    const todoId = parseInt(id);
    const attachmentIdNum = parseInt(attachmentId);

    if (isNaN(todoId) || isNaN(attachmentIdNum)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 첨부파일 존재 확인
    const attachment = await db.queryOne<{ id: number; todo_id: number }>(
      "SELECT id, todo_id FROM todo_attachments WHERE id = $1 AND todo_id = $2",
      [attachmentIdNum, todoId]
    );

    if (!attachment) {
      return NextResponse.json(
        { success: false, message: "첨부파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제
    const result = await db.execute(
      "DELETE FROM todo_attachments WHERE id = $1",
      [attachmentIdNum]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "첨부파일 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "첨부파일이 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("Todolist 첨부파일 삭제 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "첨부파일 삭제에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}


/**
 * 코멘트 첨부파일 삭제 API
 * DELETE: 첨부파일 삭제
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// DELETE: 코멘트 첨부파일 삭제
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { id, attachmentId } = await params;
    const commentId = parseInt(id);
    const attachmentIdNum = parseInt(attachmentId);

    if (isNaN(commentId) || isNaN(attachmentIdNum)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 첨부파일 존재 확인
    const attachment = await db.queryOne<{ id: number; comment_id: number }>(
      "SELECT id, comment_id FROM comment_attachments WHERE id = $1 AND comment_id = $2",
      [attachmentIdNum, commentId]
    );

    if (!attachment) {
      return NextResponse.json(
        { success: false, message: "첨부파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제
    const result = await db.execute(
      "DELETE FROM comment_attachments WHERE id = $1",
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
    console.error("코멘트 첨부파일 삭제 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "첨부파일 삭제에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}


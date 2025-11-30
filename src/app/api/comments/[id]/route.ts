/**
 * 코멘트 상세 API
 * GET: 단일 조회
 * PUT: 수정
 * DELETE: 삭제
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 코멘트 단일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 코멘트 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    const comment = await db.queryOne<{
      id: number;
      workspace_id: number;
      content: string;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM comments WHERE id = $1", [commentId]);

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "코멘트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error("코멘트 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "코멘트 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 코멘트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = parseInt(id);
    const { content } = await request.json();

    if (isNaN(commentId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 코멘트 ID입니다." },
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

    // 코멘트 존재 확인
    const existingComment = await db.queryOne<{ id: number }>(
      "SELECT id FROM comments WHERE id = $1",
      [commentId]
    );

    if (!existingComment) {
      return NextResponse.json(
        { success: false, message: "코멘트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 수정
    const result = await db.execute(
      "UPDATE comments SET content = $1 WHERE id = $2",
      [content.trim(), commentId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "코멘트 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    // 수정된 코멘트 조회
    const comment = await db.queryOne<{
      id: number;
      workspace_id: number;
      content: string;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM comments WHERE id = $1", [commentId]);

    return NextResponse.json({
      success: true,
      message: "코멘트가 수정되었습니다.",
      data: comment,
    });
  } catch (error: any) {
    console.error("코멘트 수정 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "코멘트 수정에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

// DELETE: 코멘트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 코멘트 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 코멘트 존재 확인
    const existingComment = await db.queryOne<{ id: number }>(
      "SELECT id FROM comments WHERE id = $1",
      [commentId]
    );

    if (!existingComment) {
      return NextResponse.json(
        { success: false, message: "코멘트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제 (CASCADE로 첨부파일도 자동 삭제)
    const result = await db.execute("DELETE FROM comments WHERE id = $1", [
      commentId,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "코멘트 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "코멘트가 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("코멘트 삭제 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "코멘트 삭제에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}


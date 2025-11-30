/**
 * URL 바로가기 상세 API
 * GET: 단일 조회
 * PUT: 수정
 * DELETE: 삭제
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: URL 바로가기 단일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookmarkId = parseInt(id);

    if (isNaN(bookmarkId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 바로가기 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    const bookmark = await db.queryOne<{
      id: number;
      workspace_id: number;
      title: string;
      url: string;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM bookmarks WHERE id = $1", [bookmarkId]);

    if (!bookmark) {
      return NextResponse.json(
        { success: false, message: "바로가기를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bookmark });
  } catch (error) {
    console.error("URL 바로가기 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "바로가기 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT: URL 바로가기 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookmarkId = parseInt(id);
    const { title, url } = await request.json();

    if (isNaN(bookmarkId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 바로가기 ID입니다." },
        { status: 400 }
      );
    }

    if (title !== undefined && (!title || title.trim() === "")) {
      return NextResponse.json(
        { success: false, message: "제목을 입력해주세요." },
        { status: 400 }
      );
    }

    if (url !== undefined) {
      if (!url || url.trim() === "") {
        return NextResponse.json(
          { success: false, message: "URL을 입력해주세요." },
          { status: 400 }
        );
      }
      // URL 유효성 검사
      try {
        new URL(url.trim());
      } catch {
        return NextResponse.json(
          { success: false, message: "유효한 URL 형식이 아닙니다." },
          { status: 400 }
        );
      }
    }

    const db = getDatabase();

    // 바로가기 존재 확인
    const existingBookmark = await db.queryOne<{ id: number }>(
      "SELECT id FROM bookmarks WHERE id = $1",
      [bookmarkId]
    );

    if (!existingBookmark) {
      return NextResponse.json(
        { success: false, message: "바로가기를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 업데이트할 필드 구성
    const updates: string[] = [];
    const sqlParams: unknown[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      sqlParams.push(title.trim());
    }
    if (url !== undefined) {
      updates.push(`url = $${paramIndex++}`);
      sqlParams.push(url.trim());
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "수정할 내용이 없습니다." },
        { status: 400 }
      );
    }

    sqlParams.push(bookmarkId);
    const sql = `UPDATE bookmarks SET ${updates.join(", ")} WHERE id = $${paramIndex}`;

    // 수정
    const result = await db.execute(sql, sqlParams);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "바로가기 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    // 수정된 바로가기 조회
    const bookmark = await db.queryOne<{
      id: number;
      workspace_id: number;
      title: string;
      url: string;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM bookmarks WHERE id = $1", [bookmarkId]);

    return NextResponse.json({
      success: true,
      message: "바로가기가 수정되었습니다.",
      data: bookmark,
    });
  } catch (error: any) {
    console.error("URL 바로가기 수정 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "바로가기 수정에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

// DELETE: URL 바로가기 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookmarkId = parseInt(id);

    if (isNaN(bookmarkId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 바로가기 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 바로가기 존재 확인
    const existingBookmark = await db.queryOne<{ id: number }>(
      "SELECT id FROM bookmarks WHERE id = $1",
      [bookmarkId]
    );

    if (!existingBookmark) {
      return NextResponse.json(
        { success: false, message: "바로가기를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제
    const result = await db.execute("DELETE FROM bookmarks WHERE id = $1", [
      bookmarkId,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "바로가기 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "바로가기가 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("URL 바로가기 삭제 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "바로가기 삭제에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}


/**
 * 서류 단일 조회/수정/삭제 API
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 서류 단일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentId = parseInt(id);

    if (isNaN(documentId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 서류 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const document = await db.queryOne<{
      id: number;
      workspace_id: number;
      document_type: string;
      title: string;
      file_url: string;
      file_name: string | null;
      file_size: number | null;
      mime_type: string | null;
      expiry_date: string | null;
      memo: string | null;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM documents WHERE id = $1", [documentId]);

    if (!document) {
      return NextResponse.json(
        { success: false, message: "서류를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("서류 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "서류 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 서류 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentId = parseInt(id);
    const {
      document_type,
      title,
      file_url,
      file_name,
      file_size,
      mime_type,
      expiry_date,
      memo,
    } = await request.json();

    if (isNaN(documentId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 서류 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 존재 확인
    const existing = await db.queryOne<{ id: number }>(
      "SELECT id FROM documents WHERE id = $1",
      [documentId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "서류를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 수정할 필드 구성
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (document_type !== undefined) {
      if (document_type.trim() === "") {
        return NextResponse.json(
          { success: false, message: "서류 종류를 입력해주세요." },
          { status: 400 }
        );
      }
      updates.push(`document_type = $${paramIndex++}`);
      values.push(document_type.trim());
    }

    if (title !== undefined) {
      if (title.trim() === "") {
        return NextResponse.json(
          { success: false, message: "서류 제목을 입력해주세요." },
          { status: 400 }
        );
      }
      updates.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }

    if (file_url !== undefined) {
      if (file_url.trim() === "") {
        return NextResponse.json(
          { success: false, message: "파일 URL을 입력해주세요." },
          { status: 400 }
        );
      }
      updates.push(`file_url = $${paramIndex++}`);
      values.push(file_url.trim());
    }

    if (file_name !== undefined) {
      updates.push(`file_name = $${paramIndex++}`);
      values.push(file_name || null);
    }

    if (file_size !== undefined) {
      updates.push(`file_size = $${paramIndex++}`);
      values.push(file_size || null);
    }

    if (mime_type !== undefined) {
      updates.push(`mime_type = $${paramIndex++}`);
      values.push(mime_type || null);
    }

    if (expiry_date !== undefined) {
      updates.push(`expiry_date = $${paramIndex++}`);
      values.push(expiry_date || null);
    }

    if (memo !== undefined) {
      updates.push(`memo = $${paramIndex++}`);
      values.push(memo || null);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "수정할 내용이 없습니다." },
        { status: 400 }
      );
    }

    values.push(documentId);
    const sql = `UPDATE documents SET ${updates.join(", ")} WHERE id = $${paramIndex}`;

    const result = await db.execute(sql, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "서류 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    // 수정된 서류 조회
    const document = await db.queryOne<{
      id: number;
      workspace_id: number;
      document_type: string;
      title: string;
      file_url: string;
      file_name: string | null;
      file_size: number | null;
      mime_type: string | null;
      expiry_date: string | null;
      memo: string | null;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM documents WHERE id = $1", [documentId]);

    return NextResponse.json({
      success: true,
      message: "서류가 수정되었습니다.",
      data: document,
    });
  } catch (error) {
    console.error("서류 수정 오류:", error);
    return NextResponse.json(
      { success: false, message: "서류 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 서류 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentId = parseInt(id);

    if (isNaN(documentId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 서류 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 존재 확인
    const existing = await db.queryOne<{ id: number }>(
      "SELECT id FROM documents WHERE id = $1",
      [documentId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "서류를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제
    const result = await db.execute("DELETE FROM documents WHERE id = $1", [
      documentId,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "서류 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "서류가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("서류 삭제 오류:", error);
    return NextResponse.json(
      { success: false, message: "서류 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}


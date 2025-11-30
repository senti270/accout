/**
 * 서류 관리 API
 * GET: 목록 조회
 * POST: 생성
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 서류 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspace_id");
    const documentType = searchParams.get("document_type");
    const title = searchParams.get("title");

    const db = getDatabase();

    // 동적 쿼리 구성
    let sql = "SELECT * FROM documents WHERE 1=1";
    const params: unknown[] = [];
    let paramIndex = 1;

    if (workspaceId) {
      const id = parseInt(workspaceId);
      if (!isNaN(id)) {
        sql += ` AND workspace_id = $${paramIndex++}`;
        params.push(id);
      }
    }

    if (documentType) {
      sql += ` AND document_type = $${paramIndex++}`;
      params.push(documentType);
    }

    if (title) {
      sql += ` AND title LIKE $${paramIndex++}`;
      params.push(`%${title}%`);
    }

    sql += " ORDER BY created_at DESC";

    const documents = await db.query<{
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
    }>(sql, params);

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error("서류 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "서류 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST: 서류 생성
export async function POST(request: NextRequest) {
  try {
    const {
      workspace_id,
      document_type,
      title,
      file_url,
      file_name,
      file_size,
      mime_type,
      expiry_date,
      memo,
    } = await request.json();

    // 필수 필드 검증
    if (!workspace_id) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!document_type || document_type.trim() === "") {
      return NextResponse.json(
        { success: false, message: "서류 종류를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { success: false, message: "서류 제목을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!file_url || file_url.trim() === "") {
      return NextResponse.json(
        { success: false, message: "파일 URL을 입력해주세요." },
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
      "INSERT INTO documents (workspace_id, document_type, title, file_url, file_name, file_size, mime_type, expiry_date, memo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        workspace_id,
        document_type.trim(),
        title.trim(),
        file_url.trim(),
        file_name || null,
        file_size || null,
        mime_type || null,
        expiry_date || null,
        memo || null,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "서류 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 생성된 서류 조회
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
    }>(
      "SELECT * FROM documents WHERE workspace_id = $1 AND document_type = $2 AND title = $3 ORDER BY id DESC LIMIT 1",
      [workspace_id, document_type.trim(), title.trim()]
    );

    return NextResponse.json(
      { success: true, message: "서류가 생성되었습니다.", data: document },
      { status: 201 }
    );
  } catch (error) {
    console.error("서류 생성 오류:", error);
    return NextResponse.json(
      { success: false, message: "서류 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}


/**
 * 프로젝트 단일 조회/수정/삭제 API
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 프로젝트 단일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = getDatabase();
    const project = await db.queryOne<{
      id: string;
      workspace_id: number;
      name: string;
      start_date: string | null;
      end_date: string | null;
      memo: string | null;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM projects WHERE id = $1", [id]);

    if (!project) {
      return NextResponse.json(
        { success: false, message: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error("프로젝트 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "프로젝트 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 프로젝트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, start_date, end_date, memo } = await request.json();

    const db = getDatabase();

    // 존재 확인
    const existing = await db.queryOne<{ id: string }>(
      "SELECT id FROM projects WHERE id = $1",
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 수정 (name이 제공된 경우에만 업데이트)
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      if (name.trim() === "") {
        return NextResponse.json(
          { success: false, message: "프로젝트명을 입력해주세요." },
          { status: 400 }
        );
      }
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(start_date || null);
    }

    if (end_date !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(end_date || null);
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

    values.push(id);
    const sql = `UPDATE projects SET ${updates.join(", ")} WHERE id = $${paramIndex}`;

    const result = await db.execute(sql, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "프로젝트 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    // 수정된 프로젝트 조회
    const project = await db.queryOne<{
      id: string;
      workspace_id: number;
      name: string;
      start_date: string | null;
      end_date: string | null;
      memo: string | null;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM projects WHERE id = $1", [id]);

    return NextResponse.json({
      success: true,
      message: "프로젝트가 수정되었습니다.",
      data: project,
    });
  } catch (error) {
    console.error("프로젝트 수정 오류:", error);
    return NextResponse.json(
      { success: false, message: "프로젝트 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 프로젝트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = getDatabase();

    // 존재 확인
    const existing = await db.queryOne<{ id: string }>(
      "SELECT id FROM projects WHERE id = $1",
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제 (CASCADE로 관련 거래 내역도 자동 삭제됨)
    const result = await db.execute("DELETE FROM projects WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "프로젝트 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "프로젝트가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("프로젝트 삭제 오류:", error);
    return NextResponse.json(
      { success: false, message: "프로젝트 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}


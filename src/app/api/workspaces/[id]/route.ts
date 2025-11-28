/**
 * 워크스페이스 단일 조회/수정/삭제 API
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 워크스페이스 단일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id);

    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 워크스페이스 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const workspace = await db.queryOne<{
      id: number;
      name: string;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM workspaces WHERE id = $1", [workspaceId]);

    if (!workspace) {
      return NextResponse.json(
        { success: false, message: "워크스페이스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: workspace });
  } catch (error) {
    console.error("워크스페이스 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "워크스페이스 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 워크스페이스 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id);
    const { name } = await request.json();

    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 워크스페이스 ID입니다." },
        { status: 400 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "워크스페이스 이름을 입력해주세요." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 존재 확인
    const existing = await db.queryOne<{ id: number }>(
      "SELECT id FROM workspaces WHERE id = $1",
      [workspaceId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "워크스페이스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 중복 확인 (자기 자신 제외)
    const duplicate = await db.queryOne<{ id: number }>(
      "SELECT id FROM workspaces WHERE name = $1 AND id != $2",
      [name.trim(), workspaceId]
    );

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "이미 존재하는 워크스페이스 이름입니다." },
        { status: 400 }
      );
    }

    // 수정
    const result = await db.execute(
      "UPDATE workspaces SET name = $1 WHERE id = $2",
      [name.trim(), workspaceId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    // 수정된 워크스페이스 조회
    const workspace = await db.queryOne<{
      id: number;
      name: string;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM workspaces WHERE id = $1", [workspaceId]);

    return NextResponse.json({
      success: true,
      message: "워크스페이스가 수정되었습니다.",
      data: workspace,
    });
  } catch (error) {
    console.error("워크스페이스 수정 오류:", error);
    return NextResponse.json(
      { success: false, message: "워크스페이스 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 워크스페이스 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id);

    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 워크스페이스 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 존재 확인
    const existing = await db.queryOne<{ id: number }>(
      "SELECT id FROM workspaces WHERE id = $1",
      [workspaceId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "워크스페이스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제 (CASCADE로 관련 데이터도 자동 삭제됨)
    const result = await db.execute(
      "DELETE FROM workspaces WHERE id = $1",
      [workspaceId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "워크스페이스가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("워크스페이스 삭제 오류:", error);
    return NextResponse.json(
      { success: false, message: "워크스페이스 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}


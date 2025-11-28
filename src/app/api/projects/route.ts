/**
 * 프로젝트 API
 * GET: 목록 조회
 * POST: 생성
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 프로젝트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspace_id");

    const db = getDatabase();

    let projects;
    if (workspaceId) {
      // 특정 워크스페이스의 프로젝트만 조회
      const id = parseInt(workspaceId);
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, message: "유효하지 않은 워크스페이스 ID입니다." },
          { status: 400 }
        );
      }
      projects = await db.query<{
        id: string;
        workspace_id: number;
        name: string;
        start_date: string | null;
        end_date: string | null;
        memo: string | null;
        created_at: string;
        updated_at: string;
      }>(
        "SELECT * FROM projects WHERE workspace_id = $1 ORDER BY created_at DESC",
        [id]
      );
    } else {
      // 모든 프로젝트 조회
      projects = await db.query<{
        id: string;
        workspace_id: number;
        name: string;
        start_date: string | null;
        end_date: string | null;
        memo: string | null;
        created_at: string;
        updated_at: string;
      }>("SELECT * FROM projects ORDER BY created_at DESC");
    }

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error("프로젝트 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "프로젝트 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST: 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    const { id, workspace_id, name, start_date, end_date, memo } =
      await request.json();

    // 필수 필드 검증
    if (!id || id.trim() === "") {
      return NextResponse.json(
        { success: false, message: "프로젝트 아이디를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!workspace_id) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "프로젝트명을 입력해주세요." },
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

    // 프로젝트 아이디 중복 확인
    const existing = await db.queryOne<{ id: string }>(
      "SELECT id FROM projects WHERE id = $1",
      [id.trim()]
    );

    if (existing) {
      return NextResponse.json(
        { success: false, message: "이미 존재하는 프로젝트 아이디입니다." },
        { status: 400 }
      );
    }

    // 생성
    const result = await db.execute(
      "INSERT INTO projects (id, workspace_id, name, start_date, end_date, memo) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        id.trim(),
        workspace_id,
        name.trim(),
        start_date || null,
        end_date || null,
        memo || null,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "프로젝트 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 생성된 프로젝트 조회
    const project = await db.queryOne<{
      id: string;
      workspace_id: number;
      name: string;
      start_date: string | null;
      end_date: string | null;
      memo: string | null;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM projects WHERE id = $1", [id.trim()]);

    return NextResponse.json(
      { success: true, message: "프로젝트가 생성되었습니다.", data: project },
      { status: 201 }
    );
  } catch (error) {
    console.error("프로젝트 생성 오류:", error);
    return NextResponse.json(
      { success: false, message: "프로젝트 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}


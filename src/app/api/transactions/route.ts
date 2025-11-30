/**
 * 입출금 내역 API
 * GET: 목록 조회 (필터링 지원)
 * POST: 생성
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 거래 내역 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspace_id");
    const projectId = searchParams.get("project_id");
    const description = searchParams.get("description");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";

    const db = getDatabase();

    // 동적 쿼리 구성
    let sql = "SELECT * FROM transactions WHERE 1=1";
    const params: unknown[] = [];
    let paramIndex = 1;

    if (workspaceId) {
      const id = parseInt(workspaceId);
      if (!isNaN(id)) {
        sql += ` AND workspace_id = $${paramIndex++}`;
        params.push(id);
      }
    }

    if (projectId) {
      sql += ` AND project_id = $${paramIndex++}`;
      params.push(projectId);
    }

    if (description) {
      sql += ` AND description LIKE $${paramIndex++}`;
      params.push(`%${description}%`);
    }

    if (startDate) {
      sql += ` AND transaction_date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND transaction_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    sql += " ORDER BY transaction_date DESC, created_at DESC";
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const transactions = await db.query<{
      id: number;
      workspace_id: number;
      project_id: string;
      vendor_id: number | null;
      category: string;
      deposit_amount: number;
      withdrawal_amount: number;
      transaction_date: string;
      description: string | null;
      memo: string | null;
      created_at: string;
      updated_at: string;
    }>(sql, params);

    // 총 개수 조회 (페이징용)
    let countSql = "SELECT COUNT(*) as total FROM transactions WHERE 1=1";
    const countParams: unknown[] = [];
    let countParamIndex = 1;

    if (workspaceId) {
      const id = parseInt(workspaceId);
      if (!isNaN(id)) {
        countSql += ` AND workspace_id = $${countParamIndex++}`;
        countParams.push(id);
      }
    }

    if (projectId) {
      countSql += ` AND project_id = $${countParamIndex++}`;
      countParams.push(projectId);
    }

    if (description) {
      countSql += ` AND description LIKE $${countParamIndex++}`;
      countParams.push(`%${description}%`);
    }

    if (startDate) {
      countSql += ` AND transaction_date >= $${countParamIndex++}`;
      countParams.push(startDate);
    }

    if (endDate) {
      countSql += ` AND transaction_date <= $${countParamIndex++}`;
      countParams.push(endDate);
    }

    const countResult = await db.queryOne<{ total: number }>(
      countSql,
      countParams
    );

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        total: countResult?.total || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error: any) {
    console.error("거래 내역 조회 오류:", error);
    const errorMessage = error?.message || "거래 내역 조회에 실패했습니다.";
    
    // vendor_id 컬럼이 없는 경우 마이그레이션 안내
    if (errorMessage.includes("no such column: vendor_id")) {
      return NextResponse.json(
        { 
          success: false, 
          message: "데이터베이스 스키마가 업데이트되지 않았습니다. /api/migrate-vendors를 실행해주세요." 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST: 거래 내역 생성
export async function POST(request: NextRequest) {
  try {
    const {
      workspace_id,
      project_id,
      vendor_id,
      category,
      deposit_amount = 0,
      withdrawal_amount = 0,
      transaction_date,
      memo,
    } = await request.json();

    // 필수 필드 검증
    if (!workspace_id) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!project_id || project_id.trim() === "") {
      return NextResponse.json(
        { success: false, message: "프로젝트 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!category || category.trim() === "") {
      return NextResponse.json(
        { success: false, message: "카테고리를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!transaction_date) {
      return NextResponse.json(
        { success: false, message: "거래일자를 입력해주세요." },
        { status: 400 }
      );
    }

    if (deposit_amount < 0 || withdrawal_amount < 0) {
      return NextResponse.json(
        { success: false, message: "금액은 0 이상이어야 합니다." },
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

    // 프로젝트 존재 확인
    const project = await db.queryOne<{ id: string }>(
      "SELECT id FROM projects WHERE id = $1",
      [project_id.trim()]
    );

    if (!project) {
      return NextResponse.json(
        { success: false, message: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // vendor_id가 있으면 거래처 존재 확인
    if (vendor_id) {
      const vendor = await db.queryOne<{ id: number }>(
        "SELECT id FROM vendors WHERE id = $1 AND workspace_id = $2",
        [vendor_id, workspace_id]
      );

      if (!vendor) {
        return NextResponse.json(
          { success: false, message: "거래처를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
    }

    // 생성
    const result = await db.execute(
      "INSERT INTO transactions (workspace_id, project_id, vendor_id, category, deposit_amount, withdrawal_amount, transaction_date, memo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        workspace_id,
        project_id.trim(),
        vendor_id || null,
        category.trim(),
        deposit_amount,
        withdrawal_amount,
        transaction_date,
        memo || null,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "거래 내역 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 생성된 거래 내역 조회
    const transaction = await db.queryOne<{
      id: number;
      workspace_id: number;
      project_id: string;
      vendor_id: number | null;
      category: string;
      deposit_amount: number;
      withdrawal_amount: number;
      transaction_date: string;
      memo: string | null;
      created_at: string;
      updated_at: string;
    }>(
      "SELECT * FROM transactions WHERE workspace_id = $1 AND project_id = $2 AND category = $3 AND transaction_date = $4 ORDER BY id DESC LIMIT 1",
      [workspace_id, project_id.trim(), category.trim(), transaction_date]
    );

    return NextResponse.json(
      {
        success: true,
        message: "거래 내역이 생성되었습니다.",
        data: transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("거래 내역 생성 오류:", error);
    return NextResponse.json(
      { success: false, message: "거래 내역 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}


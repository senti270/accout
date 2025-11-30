/**
 * 거래 내역 단일 조회/수정/삭제 API
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 거래 내역 단일 조회 (증빙서류 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 거래 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 거래 내역 조회
    const transaction = await db.queryOne<{
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
    }>("SELECT * FROM transactions WHERE id = $1", [transactionId]);

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "거래 내역을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 증빙서류 조회
    const receipts = await db.query<{
      id: number;
      transaction_id: number;
      image_url: string;
      file_name: string | null;
      file_size: number | null;
      mime_type: string | null;
      created_at: string;
    }>(
      "SELECT * FROM transaction_receipts WHERE transaction_id = $1 ORDER BY created_at DESC",
      [transactionId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        receipts,
      },
    });
  } catch (error) {
    console.error("거래 내역 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "거래 내역 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 거래 내역 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);
    const {
      project_id,
      vendor_id,
      category,
      deposit_amount,
      withdrawal_amount,
      transaction_date,
      description,
      memo,
    } = await request.json();

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 거래 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 존재 확인
    const existing = await db.queryOne<{ id: number }>(
      "SELECT id FROM transactions WHERE id = $1",
      [transactionId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "거래 내역을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 수정할 필드 구성
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (project_id !== undefined) {
      if (project_id.trim() === "") {
        return NextResponse.json(
          { success: false, message: "프로젝트 ID를 입력해주세요." },
          { status: 400 }
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
      updates.push(`project_id = $${paramIndex++}`);
      values.push(project_id.trim());
    }

    if (vendor_id !== undefined) {
      if (vendor_id !== null) {
        // 거래처 존재 확인
        const existingTransaction = await db.queryOne<{ workspace_id: number }>(
          "SELECT workspace_id FROM transactions WHERE id = $1",
          [transactionId]
        );
        if (existingTransaction) {
          const vendor = await db.queryOne<{ id: number }>(
            "SELECT id FROM vendors WHERE id = $1 AND workspace_id = $2",
            [vendor_id, existingTransaction.workspace_id]
          );
          if (!vendor) {
            return NextResponse.json(
              { success: false, message: "거래처를 찾을 수 없습니다." },
              { status: 404 }
            );
          }
        }
      }
      updates.push(`vendor_id = $${paramIndex++}`);
      values.push(vendor_id || null);
    }

    if (category !== undefined) {
      if (category.trim() === "") {
        return NextResponse.json(
          { success: false, message: "카테고리를 입력해주세요." },
          { status: 400 }
        );
      }
      updates.push(`category = $${paramIndex++}`);
      values.push(category.trim());
    }

    if (deposit_amount !== undefined) {
      if (deposit_amount < 0) {
        return NextResponse.json(
          { success: false, message: "입금액은 0 이상이어야 합니다." },
          { status: 400 }
        );
      }
      updates.push(`deposit_amount = $${paramIndex++}`);
      values.push(deposit_amount);
    }

    if (withdrawal_amount !== undefined) {
      if (withdrawal_amount < 0) {
        return NextResponse.json(
          { success: false, message: "출금액은 0 이상이어야 합니다." },
          { status: 400 }
        );
      }
      updates.push(`withdrawal_amount = $${paramIndex++}`);
      values.push(withdrawal_amount);
    }

    if (transaction_date !== undefined) {
      updates.push(`transaction_date = $${paramIndex++}`);
      values.push(transaction_date);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description || null);
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

    values.push(transactionId);
    const sql = `UPDATE transactions SET ${updates.join(", ")} WHERE id = $${paramIndex}`;

    const result = await db.execute(sql, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "거래 내역 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    // 수정된 거래 내역 조회
    const transaction = await db.queryOne<{
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
    }>("SELECT * FROM transactions WHERE id = $1", [transactionId]);

    return NextResponse.json({
      success: true,
      message: "거래 내역이 수정되었습니다.",
      data: transaction,
    });
  } catch (error) {
    console.error("거래 내역 수정 오류:", error);
    return NextResponse.json(
      { success: false, message: "거래 내역 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 거래 내역 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 거래 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 존재 확인
    const existing = await db.queryOne<{ id: number }>(
      "SELECT id FROM transactions WHERE id = $1",
      [transactionId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "거래 내역을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제 (CASCADE로 증빙서류도 자동 삭제됨)
    const result = await db.execute(
      "DELETE FROM transactions WHERE id = $1",
      [transactionId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "거래 내역 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "거래 내역이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("거래 내역 삭제 오류:", error);
    return NextResponse.json(
      { success: false, message: "거래 내역 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}


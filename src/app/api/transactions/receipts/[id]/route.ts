/**
 * 증빙서류 단일 삭제 API
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// DELETE: 증빙서류 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const receiptId = parseInt(id);

    if (isNaN(receiptId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 증빙서류 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 존재 확인
    const existing = await db.queryOne<{ id: number }>(
      "SELECT id FROM transaction_receipts WHERE id = $1",
      [receiptId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "증빙서류를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제
    const result = await db.execute(
      "DELETE FROM transaction_receipts WHERE id = $1",
      [receiptId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "증빙서류 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "증빙서류가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("증빙서류 삭제 오류:", error);
    return NextResponse.json(
      { success: false, message: "증빙서류 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}


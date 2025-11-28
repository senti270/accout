/**
 * 거래 증빙서류 API
 * GET: 증빙서류 목록 조회
 * POST: 증빙서류 추가
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 증빙서류 목록 조회
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

    // 거래 존재 확인
    const transaction = await db.queryOne<{ id: number }>(
      "SELECT id FROM transactions WHERE id = $1",
      [transactionId]
    );

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

    return NextResponse.json({ success: true, data: receipts });
  } catch (error) {
    console.error("증빙서류 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "증빙서류 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST: 증빙서류 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id);
    const { image_url, file_name, file_size, mime_type } = await request.json();

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 거래 ID입니다." },
        { status: 400 }
      );
    }

    if (!image_url || image_url.trim() === "") {
      return NextResponse.json(
        { success: false, message: "이미지 URL을 입력해주세요." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 거래 존재 확인
    const transaction = await db.queryOne<{ id: number }>(
      "SELECT id FROM transactions WHERE id = $1",
      [transactionId]
    );

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "거래 내역을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 증빙서류 추가
    const result = await db.execute(
      "INSERT INTO transaction_receipts (transaction_id, image_url, file_name, file_size, mime_type) VALUES ($1, $2, $3, $4, $5)",
      [
        transactionId,
        image_url.trim(),
        file_name || null,
        file_size || null,
        mime_type || null,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "증빙서류 추가에 실패했습니다." },
        { status: 500 }
      );
    }

    // 추가된 증빙서류 조회
    const receipt = await db.queryOne<{
      id: number;
      transaction_id: number;
      image_url: string;
      file_name: string | null;
      file_size: number | null;
      mime_type: string | null;
      created_at: string;
    }>(
      "SELECT * FROM transaction_receipts WHERE transaction_id = $1 AND image_url = $2 ORDER BY id DESC LIMIT 1",
      [transactionId, image_url.trim()]
    );

    return NextResponse.json(
      {
        success: true,
        message: "증빙서류가 추가되었습니다.",
        data: receipt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("증빙서류 추가 오류:", error);
    return NextResponse.json(
      { success: false, message: "증빙서류 추가에 실패했습니다." },
      { status: 500 }
    );
  }
}


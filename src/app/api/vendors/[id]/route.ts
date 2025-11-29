/**
 * 거래처 단일 조회/수정/삭제 API
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 거래처 단일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = parseInt(id);

    if (isNaN(vendorId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 거래처 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const vendor = await db.queryOne<{
      id: number;
      workspace_id: number;
      business_number: string | null;
      name: string;
      contact_person: string | null;
      contact_phone: string | null;
      tax_email: string | null;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM vendors WHERE id = $1", [vendorId]);

    if (!vendor) {
      return NextResponse.json(
        { success: false, message: "거래처를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: vendor });
  } catch (error) {
    console.error("거래처 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "거래처 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 거래처 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = parseInt(id);

    if (isNaN(vendorId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 거래처 ID입니다." },
        { status: 400 }
      );
    }

    const {
      business_number,
      name,
      contact_person,
      contact_phone,
      tax_email,
    } = await request.json();

    const db = getDatabase();

    // 거래처 존재 확인
    const existing = await db.queryOne<{ id: number }>(
      "SELECT id FROM vendors WHERE id = $1",
      [vendorId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "거래처를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 필수 필드 검증
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "거래처명을 입력해주세요." },
        { status: 400 }
      );
    }

    // 수정
    const result = await db.execute(
      "UPDATE vendors SET business_number = $1, name = $2, contact_person = $3, contact_phone = $4, tax_email = $5 WHERE id = $6",
      [
        business_number?.trim() || null,
        name.trim(),
        contact_person?.trim() || null,
        contact_phone?.trim() || null,
        tax_email?.trim() || null,
        vendorId,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "거래처 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    // 수정된 거래처 조회
    const vendor = await db.queryOne<{
      id: number;
      workspace_id: number;
      business_number: string | null;
      name: string;
      contact_person: string | null;
      contact_phone: string | null;
      tax_email: string | null;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM vendors WHERE id = $1", [vendorId]);

    return NextResponse.json({
      success: true,
      message: "거래처가 수정되었습니다.",
      data: vendor,
    });
  } catch (error) {
    console.error("거래처 수정 오류:", error);
    return NextResponse.json(
      { success: false, message: "거래처 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 거래처 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = parseInt(id);

    if (isNaN(vendorId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 거래처 ID입니다." },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 거래처 존재 확인
    const existing = await db.queryOne<{ id: number }>(
      "SELECT id FROM vendors WHERE id = $1",
      [vendorId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "거래처를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제
    const result = await db.execute("DELETE FROM vendors WHERE id = $1", [
      vendorId,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "거래처 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "거래처가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("거래처 삭제 오류:", error);
    return NextResponse.json(
      { success: false, message: "거래처 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}


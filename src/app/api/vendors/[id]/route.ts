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
      bank_code: string | null;
      bank_account: string | null;
      business_certificate_file_url: string | null;
      business_certificate_file_name: string | null;
      business_certificate_file_size: number | null;
      business_certificate_mime_type: string | null;
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
      bank_code,
      bank_account,
      business_certificate_file_url,
      business_certificate_file_name,
      business_certificate_file_size,
      business_certificate_mime_type,
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

    // 기존 거래처 정보 조회 (파일 정보 유지를 위해)
    const existingVendor = await db.queryOne<{
      business_certificate_file_url: string | null;
      business_certificate_file_name: string | null;
      business_certificate_file_size: number | null;
      business_certificate_mime_type: string | null;
    }>(
      "SELECT business_certificate_file_url, business_certificate_file_name, business_certificate_file_size, business_certificate_mime_type FROM vendors WHERE id = $1",
      [vendorId]
    );

    // 파일 정보가 제공되지 않으면 기존 값 유지
    const finalFileUrl =
      business_certificate_file_url !== undefined
        ? business_certificate_file_url || null
        : existingVendor?.business_certificate_file_url || null;
    const finalFileName =
      business_certificate_file_name !== undefined
        ? business_certificate_file_name || null
        : existingVendor?.business_certificate_file_name || null;
    const finalFileSize =
      business_certificate_file_size !== undefined
        ? business_certificate_file_size || null
        : existingVendor?.business_certificate_file_size || null;
    const finalMimeType =
      business_certificate_mime_type !== undefined
        ? business_certificate_mime_type || null
        : existingVendor?.business_certificate_mime_type || null;

    // 수정
    const result = await db.execute(
      "UPDATE vendors SET business_number = $1, name = $2, contact_person = $3, contact_phone = $4, tax_email = $5, bank_code = $6, bank_account = $7, business_certificate_file_url = $8, business_certificate_file_name = $9, business_certificate_file_size = $10, business_certificate_mime_type = $11, updated_at = CURRENT_TIMESTAMP WHERE id = $12",
      [
        business_number?.trim() || null,
        name.trim(),
        contact_person?.trim() || null,
        contact_phone?.trim() || null,
        tax_email?.trim() || null,
        bank_code?.trim() || null,
        bank_account?.trim() || null,
        finalFileUrl,
        finalFileName,
        finalFileSize,
        finalMimeType,
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
      bank_code: string | null;
      bank_account: string | null;
      business_certificate_file_url: string | null;
      business_certificate_file_name: string | null;
      business_certificate_file_size: number | null;
      business_certificate_mime_type: string | null;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM vendors WHERE id = $1", [vendorId]);

    return NextResponse.json({
      success: true,
      message: "거래처가 수정되었습니다.",
      data: vendor,
    });
  } catch (error: any) {
    console.error("거래처 수정 오류:", error);
    const errorMessage = error?.message || "거래처 수정에 실패했습니다.";
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage.includes("no such table") || errorMessage.includes("does not exist")
          ? "데이터베이스 테이블이 없습니다. /api/init-db를 실행해주세요."
          : errorMessage
      },
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


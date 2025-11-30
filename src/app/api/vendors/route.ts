/**
 * 거래처 API
 * GET: 목록 조회 (검색 지원)
 * POST: 생성
 */

import { getDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: 거래처 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspace_id");
    const search = searchParams.get("search"); // 검색어 (거래처명, 사업자번호)

    const db = getDatabase();

    let vendors;
    if (workspaceId) {
      const id = parseInt(workspaceId);
      if (isNaN(id)) {
        return NextResponse.json(
          { success: false, message: "유효하지 않은 워크스페이스 ID입니다." },
          { status: 400 }
        );
      }

      if (search && search.trim()) {
        // 검색어가 있으면 거래처명 또는 사업자번호로 검색
        vendors = await db.query<{
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
        }>(
          "SELECT * FROM vendors WHERE workspace_id = $1 AND (name LIKE $2 OR business_number LIKE $2) ORDER BY name",
          [id, `%${search.trim()}%`]
        );
      } else {
        vendors = await db.query<{
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
        }>("SELECT * FROM vendors WHERE workspace_id = $1 ORDER BY name", [id]);
      }
    } else {
      // 워크스페이스 ID가 없으면 모든 거래처 조회
      vendors = await db.query<{
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
      }>("SELECT * FROM vendors ORDER BY name");
    }

    return NextResponse.json({ success: true, data: vendors });
  } catch (error) {
    console.error("거래처 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "거래처 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST: 거래처 생성
export async function POST(request: NextRequest) {
  try {
    const {
      workspace_id,
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

    // 필수 필드 검증
    if (!workspace_id) {
      return NextResponse.json(
        { success: false, message: "워크스페이스 ID를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "거래처명을 입력해주세요." },
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
      "INSERT INTO vendors (workspace_id, business_number, name, contact_person, contact_phone, tax_email, bank_code, bank_account, business_certificate_file_url, business_certificate_file_name, business_certificate_file_size, business_certificate_mime_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
      [
        workspace_id,
        business_number?.trim() || null,
        name.trim(),
        contact_person?.trim() || null,
        contact_phone?.trim() || null,
        tax_email?.trim() || null,
        bank_code?.trim() || null,
        bank_account?.trim() || null,
        business_certificate_file_url || null,
        business_certificate_file_name || null,
        business_certificate_file_size || null,
        business_certificate_mime_type || null,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "거래처 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 생성된 거래처 조회
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
    }>(
      "SELECT * FROM vendors WHERE workspace_id = $1 AND name = $2 ORDER BY id DESC LIMIT 1",
      [workspace_id, name.trim()]
    );

    return NextResponse.json(
      { success: true, message: "거래처가 생성되었습니다.", data: vendor },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("거래처 생성 오류:", error);
    const errorMessage = error?.message || "거래처 생성에 실패했습니다.";
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage.includes("no such table") 
          ? "데이터베이스 테이블이 없습니다. /api/init-db를 실행해주세요." 
          : errorMessage 
      },
      { status: 500 }
    );
  }
}


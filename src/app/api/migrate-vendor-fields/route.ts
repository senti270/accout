import { migrateVendorFields } from "@/lib/db-migrate-vendor-fields";
import { NextRequest, NextResponse } from "next/server";

async function handleMigrate(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production") {
      const authHeader = request.headers.get("authorization");
      const expectedToken = process.env.MIGRATE_DB_TOKEN;

      if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json(
          { success: false, message: "인증 실패" },
          { status: 401 }
        );
      }
    }

    await migrateVendorFields();
    return NextResponse.json({
      success: true,
      message: "vendors 테이블 필드 마이그레이션 완료",
    });
  } catch (error) {
    console.error("vendors 필드 마이그레이션 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleMigrate(request);
}

export async function POST(request: NextRequest) {
  return handleMigrate(request);
}


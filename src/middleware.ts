import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 로그인 페이지와 API는 인증 체크 제외
  if (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/api/init-db")
  ) {
    return NextResponse.next();
  }

  // 클라이언트 사이드에서 인증 확인 (서버 사이드 세션은 추후 구현 가능)
  // 현재는 클라이언트 사이드에서 localStorage로 확인
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import WorkspaceSelector from "./WorkspaceSelector";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null
  );
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === "undefined") return;
    
    // 인증 확인
    const auth = localStorage.getItem("authenticated");
    if (auth === "true") {
      setAuthenticated(true);
      setLoading(false);
    } else {
      // 로그인 페이지가 아닐 때만 리다이렉트
      if (pathname !== "/login") {
        router.push("/login");
      }
      setLoading(false);
    }
  }, [router, pathname]);

  useEffect(() => {
    // 워크스페이스 ID를 localStorage에 저장
    if (selectedWorkspaceId) {
      localStorage.setItem("selectedWorkspaceId", selectedWorkspaceId.toString());
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    // 저장된 워크스페이스 ID 불러오기
    const saved = localStorage.getItem("selectedWorkspaceId");
    if (saved) {
      setSelectedWorkspaceId(parseInt(saved));
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  // 로그인 페이지는 Layout 없이 표시
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">인증 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Account 관리 시스템
              </Link>
              <WorkspaceSelector
                selectedWorkspaceId={selectedWorkspaceId}
                onWorkspaceChange={setSelectedWorkspaceId}
              />
            </div>
            <div className="flex gap-4 items-center">
              <Link
                href="/settings"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                설정
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem("authenticated");
                  localStorage.removeItem("selectedWorkspaceId");
                  router.push("/login");
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}


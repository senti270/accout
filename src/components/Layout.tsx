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

  const navItems = [
    { href: "/", label: "대시보드" },
    { href: "/transactions", label: "입출금 내역" },
    { href: "/projects", label: "프로젝트" },
    { href: "/documents", label: "서류" },
    { href: "/reports", label: "보고서" },
    { href: "/settings", label: "설정" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
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
          <nav className="border-t border-gray-200">
            <div className="flex space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}


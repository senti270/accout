"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 인증 확인
    const auth = localStorage.getItem("authenticated");
    if (auth === "true") {
      setAuthenticated(true);
    } else {
      router.push("/login");
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Account 관리 시스템
            </h1>
            <div className="flex gap-4">
              <Link
                href="/settings"
                className="text-gray-600 hover:text-gray-900"
              >
                설정
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem("authenticated");
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/workspaces"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              워크스페이스 관리
            </h2>
            <p className="text-gray-600">
              회사/사업자별 워크스페이스를 관리합니다.
            </p>
          </Link>

          <Link
            href="/transactions"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              입출금 내역
            </h2>
            <p className="text-gray-600">
              프로젝트별 입출금 내역을 조회하고 관리합니다.
            </p>
          </Link>

          <Link
            href="/projects"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              프로젝트 관리
            </h2>
            <p className="text-gray-600">
              프로젝트를 생성하고 관리합니다.
            </p>
          </Link>

          <Link
            href="/documents"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              서류 관리
            </h2>
            <p className="text-gray-600">
              사업자등록증, 임대차계약서 등 서류를 관리합니다.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}

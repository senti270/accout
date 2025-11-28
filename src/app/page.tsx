"use client";

import Layout from "@/components/Layout";
import Link from "next/link";

export default function Home() {
  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </Layout>
  );
}

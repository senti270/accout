"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";

interface DashboardStats {
  totalProjects: number;
  totalTransactions: number;
  totalDeposit: number;
  totalWithdrawal: number;
  totalDocuments: number;
  projects: Array<{
    id: string;
    name: string;
  }>;
  recentTransactions: Array<{
    id: number;
    project_id: string;
    category: string;
    deposit_amount: number;
    withdrawal_amount: number;
    transaction_date: string;
    memo: string | null;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null
  );

  useEffect(() => {
    const saved = localStorage.getItem("selectedWorkspaceId");
    if (saved) {
      const workspaceId = parseInt(saved);
      setSelectedWorkspaceId(workspaceId);
      fetchDashboardData(workspaceId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = async (workspaceId: number) => {
    setLoading(true);
    try {
      // 프로젝트 수 및 목록
      const projectsRes = await fetch(
        `/api/projects?workspace_id=${workspaceId}`
      );
      const projectsData = await projectsRes.json();
      const projects = projectsData.success ? projectsData.data : [];
      const totalProjects = projects.length;

      // 거래 내역 통계
      const transactionsRes = await fetch(
        `/api/transactions?workspace_id=${workspaceId}&limit=1000`
      );
      const transactionsData = await transactionsRes.json();
      let totalTransactions = 0;
      let totalDeposit = 0;
      let totalWithdrawal = 0;
      let recentTransactions: DashboardStats["recentTransactions"] = [];

      if (transactionsData.success) {
        const transactions = transactionsData.data || [];
        totalTransactions = transactions.length;
        totalDeposit = transactions.reduce(
          (sum: number, t: any) => sum + (t.deposit_amount || 0),
          0
        );
        totalWithdrawal = transactions.reduce(
          (sum: number, t: any) => sum + (t.withdrawal_amount || 0),
          0
        );
        recentTransactions = transactions
          .sort(
            (a: any, b: any) =>
              new Date(b.transaction_date).getTime() -
              new Date(a.transaction_date).getTime()
          )
          .slice(0, 5);
      }

      // 서류 수
      const documentsRes = await fetch(
        `/api/documents?workspace_id=${workspaceId}`
      );
      const documentsData = await documentsRes.json();
      const totalDocuments = documentsData.success
        ? documentsData.data.length
        : 0;

      setStats({
        totalProjects,
        totalTransactions,
        totalDeposit,
        totalWithdrawal,
        totalDocuments,
        projects,
        recentTransactions,
      });
    } catch (error) {
      console.error("대시보드 데이터 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedWorkspaceId) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">워크스페이스를 선택해주세요.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">로딩 중...</div>
      </Layout>
    );
  }

  const netAmount = (stats?.totalDeposit || 0) - (stats?.totalWithdrawal || 0);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  총 프로젝트
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats?.totalProjects || 0}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  총 거래 건수
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats?.totalTransactions || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 입금액</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {stats?.totalDeposit.toLocaleString() || 0}원
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 출금액</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {stats?.totalWithdrawal.toLocaleString() || 0}원
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 순 금액 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">순 금액</h2>
            <p
              className={`text-3xl font-bold ${
                netAmount >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {netAmount.toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 최근 거래 내역 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              최근 거래 내역
            </h2>
            <Link
              href="/transactions"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              전체 보기 →
            </Link>
          </div>
          {stats?.recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              거래 내역이 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      거래일
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      프로젝트
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      카테고리
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      입금
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      출금
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats?.recentTransactions.map((transaction) => {
                    const project = stats?.projects.find(
                      (p) => p.id === transaction.project_id
                    );
                    return (
                      <tr key={transaction.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.transaction_date).toLocaleDateString(
                            "ko-KR"
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {project?.name || transaction.project_id}
                        </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {transaction.category}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                        {transaction.deposit_amount > 0
                          ? transaction.deposit_amount.toLocaleString() + "원"
                          : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                        {transaction.withdrawal_amount > 0
                          ? transaction.withdrawal_amount.toLocaleString() + "원"
                          : "-"}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/transactions"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              입출금 내역
            </h3>
            <p className="text-sm text-gray-600">
              거래 내역을 조회하고 관리합니다.
            </p>
          </Link>
          <Link
            href="/projects"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              프로젝트 관리
            </h3>
            <p className="text-sm text-gray-600">
              프로젝트를 생성하고 관리합니다.
            </p>
          </Link>
          <Link
            href="/documents"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              서류 관리
            </h3>
            <p className="text-sm text-gray-600">
              사업자등록증, 임대차계약서 등을 관리합니다.
            </p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}

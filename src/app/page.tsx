"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import DashboardComments from "@/components/DashboardComments";
import DashboardTodos from "@/components/DashboardTodos";
import DashboardBookmarks from "@/components/DashboardBookmarks";

interface DashboardStats {
  totalProjects: number;
  totalTransactions: number;
  totalDeposit: number;
  totalWithdrawal: number;
  totalDocuments: number;
  totalVendors: number;
  monthDeposit: number;
  monthWithdrawal: number;
  projects: Array<{
    id: string;
    name: string;
  }>;
  vendors: Array<{
    id: number;
    name: string;
  }>;
  recentTransactions: Array<{
    id: number;
    project_id: string;
    vendor_id: number | null;
    category: string;
    description: string | null;
    deposit_amount: number;
    withdrawal_amount: number;
    transaction_date: string;
    memo: string | null;
  }>;
  projectStats: Array<{
    project_id: string;
    project_name: string;
    total_deposit: number;
    total_withdrawal: number;
    transaction_count: number;
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

  useEffect(() => {
    // 워크스페이스 변경 이벤트 구독
    const handleWorkspaceChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ workspaceId: number }>;
      const newWorkspaceId = customEvent.detail?.workspaceId;
      if (newWorkspaceId) {
        setSelectedWorkspaceId(newWorkspaceId);
        fetchDashboardData(newWorkspaceId);
      }
    };

    window.addEventListener("workspaceChanged", handleWorkspaceChange);

    return () => {
      window.removeEventListener("workspaceChanged", handleWorkspaceChange);
    };
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

      // 거래처 수 및 목록
      const vendorsRes = await fetch(
        `/api/vendors?workspace_id=${workspaceId}`
      );
      const vendorsData = await vendorsRes.json();
      const vendors = vendorsData.success ? vendorsData.data : [];
      const totalVendors = vendors.length;

      // 거래 내역 통계
      const transactionsRes = await fetch(
        `/api/transactions?workspace_id=${workspaceId}&limit=1000`
      );
      const transactionsData = await transactionsRes.json();
      let totalTransactions = 0;
      let totalDeposit = 0;
      let totalWithdrawal = 0;
      let monthDeposit = 0;
      let monthWithdrawal = 0;
      let recentTransactions: DashboardStats["recentTransactions"] = [];
      let projectStatsMap: {
        [key: string]: {
          project_name: string;
          total_deposit: number;
          total_withdrawal: number;
          transaction_count: number;
        };
      } = {};

      if (transactionsData.success) {
        const transactions = transactionsData.data || [];
        totalTransactions = transactions.length;

        // 이번 달 날짜 계산
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];

        transactions.forEach((t: any) => {
          totalDeposit += t.deposit_amount || 0;
          totalWithdrawal += t.withdrawal_amount || 0;

          // 이번 달 통계
          if (t.transaction_date >= firstDayStr) {
            monthDeposit += t.deposit_amount || 0;
            monthWithdrawal += t.withdrawal_amount || 0;
          }

          // 프로젝트별 통계
          const projectId = t.project_id;
          if (!projectStatsMap[projectId]) {
            const project = projects.find((p: any) => p.id === projectId);
            projectStatsMap[projectId] = {
              project_name: project?.name || projectId,
              total_deposit: 0,
              total_withdrawal: 0,
              transaction_count: 0,
            };
          }
          projectStatsMap[projectId].total_deposit += t.deposit_amount || 0;
          projectStatsMap[projectId].total_withdrawal +=
            t.withdrawal_amount || 0;
          projectStatsMap[projectId].transaction_count += 1;
        });

        recentTransactions = transactions
          .sort(
            (a: any, b: any) =>
              new Date(b.transaction_date).getTime() -
              new Date(a.transaction_date).getTime()
          )
          .slice(0, 10);
      }

      // 프로젝트별 통계 배열로 변환
      const projectStats = Object.entries(projectStatsMap).map(
        ([project_id, stats]) => ({
          project_id,
          ...stats,
        })
      );

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
        totalVendors,
        monthDeposit,
        monthWithdrawal,
        projects,
        vendors,
        recentTransactions,
        projectStats: projectStats.sort(
          (a, b) => b.total_deposit + b.total_withdrawal - (a.total_deposit + a.total_withdrawal)
        ).slice(0, 5),
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
  const monthNetAmount = (stats?.monthDeposit || 0) - (stats?.monthWithdrawal || 0);

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
                <p className="text-sm font-medium text-gray-600">거래처 수</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats?.totalVendors || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">서류 수</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats?.totalDocuments || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg
                  className="w-6 h-6 text-purple-600"
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
        </div>

        {/* 금액 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 전체 순 금액 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">전체 순 금액</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 입금</p>
                <p className="text-xl font-bold text-green-600 mt-1">
                  {stats?.totalDeposit.toLocaleString() || 0}원
                </p>
                <p className="text-sm text-gray-600 mt-2">총 출금</p>
                <p className="text-xl font-bold text-red-600 mt-1">
                  {stats?.totalWithdrawal.toLocaleString() || 0}원
                </p>
              </div>
              <p
                className={`text-3xl font-bold ${
                  netAmount >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {netAmount.toLocaleString()}원
              </p>
            </div>
          </div>

          {/* 이번 달 순 금액 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">이번 달 순 금액</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">이번 달 입금</p>
                <p className="text-xl font-bold text-green-600 mt-1">
                  {stats?.monthDeposit.toLocaleString() || 0}원
                </p>
                <p className="text-sm text-gray-600 mt-2">이번 달 출금</p>
                <p className="text-xl font-bold text-red-600 mt-1">
                  {stats?.monthWithdrawal.toLocaleString() || 0}원
                </p>
              </div>
              <p
                className={`text-3xl font-bold ${
                  monthNetAmount >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {monthNetAmount.toLocaleString()}원
              </p>
            </div>
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
                      거래처
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      카테고리
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                      내역
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
                    const vendor = stats?.vendors.find(
                      (v) => v.id === transaction.vendor_id
                    );
                    return (
                      <tr key={transaction.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                          {new Date(transaction.transaction_date).toLocaleDateString(
                            "ko-KR"
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {project?.name || transaction.project_id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {vendor?.name || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {transaction.category}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-xs break-words">
                          <Link
                            href={`/transactions/${transaction.id}`}
                            className="text-indigo-600 hover:text-indigo-900 hover:underline"
                          >
                            {transaction.description || "-"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-right text-green-600">
                          {transaction.deposit_amount > 0
                            ? transaction.deposit_amount.toLocaleString() + "원"
                            : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-right text-red-600">
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

        {/* 프로젝트별 요약 */}
        {stats && stats.projectStats.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                프로젝트별 요약 (상위 5개)
              </h2>
              <Link
                href="/reports"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                전체 보고서 보기 →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      프로젝트
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      거래 건수
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      총 입금
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      총 출금
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      순 금액
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.projectStats.map((project) => {
                    const net = project.total_deposit - project.total_withdrawal;
                    return (
                      <tr key={project.project_id}>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                          {project.project_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-right text-gray-600">
                          {project.transaction_count}건
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-right text-green-600">
                          {project.total_deposit.toLocaleString()}원
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-right text-red-600">
                          {project.total_withdrawal.toLocaleString()}원
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-xs text-right font-medium ${
                          net >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {net.toLocaleString()}원
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <Link
            href="/reports"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              보고서
            </h3>
            <p className="text-sm text-gray-600">
              프로젝트별 또는 기간별 통계를 조회합니다.
            </p>
          </Link>
          <Link
            href="/transactions"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              거래처 관리
            </h3>
            <p className="text-sm text-gray-600">
              거래처 정보를 관리합니다. (입출금 내역에서 관리)
            </p>
          </Link>
        </div>

        {/* 대시보드 추가 기능 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 코멘트 */}
          <DashboardComments workspaceId={selectedWorkspaceId} />
          
          {/* URL 바로가기 */}
          <DashboardBookmarks workspaceId={selectedWorkspaceId} />
        </div>

        {/* Todolist */}
        <DashboardTodos workspaceId={selectedWorkspaceId} />
      </div>
    </Layout>
  );
}

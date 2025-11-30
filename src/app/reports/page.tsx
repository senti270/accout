"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

interface Transaction {
  id: number;
  project_id: string;
  category: string;
  deposit_amount: number;
  withdrawal_amount: number;
  transaction_date: string;
  memo: string | null;
}

interface Project {
  id: string;
  name: string;
}

interface ReportSummary {
  totalDeposit: number;
  totalWithdrawal: number;
  netAmount: number;
  transactionCount: number;
}

export default function ReportsPage() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null
  );
  const [reportType, setReportType] = useState<"project" | "period">("project");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("selectedWorkspaceId");
    if (saved) {
      const workspaceId = parseInt(saved);
      setSelectedWorkspaceId(workspaceId);
      fetchProjects(workspaceId);
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
        fetchProjects(newWorkspaceId);
        setSelectedProjectId("");
        setStartDate("");
        setEndDate("");
        setTransactions([]);
        setSummary(null);
      }
    };

    window.addEventListener("workspaceChanged", handleWorkspaceChange);

    return () => {
      window.removeEventListener("workspaceChanged", handleWorkspaceChange);
    };
  }, []);

  const fetchProjects = async (workspaceId: number) => {
    try {
      const response = await fetch(
        `/api/projects?workspace_id=${workspaceId}`
      );
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error("프로젝트 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    if (!selectedWorkspaceId) {
      alert("워크스페이스를 선택해주세요.");
      return;
    }

    if (reportType === "project" && !selectedProjectId) {
      alert("프로젝트를 선택해주세요.");
      return;
    }

    if (reportType === "period" && (!startDate || !endDate)) {
      alert("기간을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspace_id: selectedWorkspaceId.toString(),
        limit: "10000",
      });

      if (reportType === "project") {
        params.append("project_id", selectedProjectId);
      } else {
        params.append("start_date", startDate);
        params.append("end_date", endDate);
      }

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      if (data.success) {
        const transactionsData = data.data || [];
        setTransactions(transactionsData);

        const totalDeposit = transactionsData.reduce(
          (sum: number, t: Transaction) => sum + (t.deposit_amount || 0),
          0
        );
        const totalWithdrawal = transactionsData.reduce(
          (sum: number, t: Transaction) => sum + (t.withdrawal_amount || 0),
          0
        );

        setSummary({
          totalDeposit,
          totalWithdrawal,
          netAmount: totalDeposit - totalWithdrawal,
          transactionCount: transactionsData.length,
        });
      }
    } catch (error) {
      console.error("보고서 데이터 조회 오류:", error);
      alert("보고서 데이터 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedWorkspaceId) {
    return (
      <Layout>
        <div className="text-center py-8">로딩 중...</div>
      </Layout>
    );
  }

  if (!selectedWorkspaceId) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">워크스페이스를 선택해주세요.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">보고서</h1>

        {/* 보고서 옵션 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                보고서 유형
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="project"
                    checked={reportType === "project"}
                    onChange={(e) => {
                      setReportType(e.target.value as "project" | "period");
                      setTransactions([]);
                      setSummary(null);
                    }}
                    className="mr-2"
                  />
                  프로젝트별
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="period"
                    checked={reportType === "period"}
                    onChange={(e) => {
                      setReportType(e.target.value as "project" | "period");
                      setTransactions([]);
                      setSummary(null);
                    }}
                    className="mr-2"
                  />
                  기간별
                </label>
              </div>
            </div>

            {reportType === "project" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 선택
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">선택하세요</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <button
              onClick={fetchReportData}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "조회 중..." : "조회"}
            </button>
          </div>
        </div>

        {/* 요약 정보 */}
        {summary && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">요약</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">총 거래 건수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.transactionCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">총 입금액</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.totalDeposit.toLocaleString()}원
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">총 출금액</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.totalWithdrawal.toLocaleString()}원
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">순 금액</p>
                <p
                  className={`text-2xl font-bold ${
                    summary.netAmount >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {summary.netAmount.toLocaleString()}원
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 거래 내역 */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              거래 내역
            </h2>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      메모
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => {
                    const project = projects.find(
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
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {transaction.memo || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {transactions.length === 0 && summary === null && !loading && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">
              보고서 옵션을 선택하고 조회 버튼을 눌러주세요.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}


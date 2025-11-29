"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import VendorAutocomplete from "@/components/VendorAutocomplete";
import VendorManagementModal from "@/components/VendorManagementModal";

interface Transaction {
  id: number;
  workspace_id: number;
  project_id: string;
  vendor_id: number | null;
  category: string;
  deposit_amount: number;
  withdrawal_amount: number;
  transaction_date: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
}

interface Vendor {
  id: number;
  name: string;
  business_number: string | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null
  );
  const [filters, setFilters] = useState({
    project_id: "",
    category: "",
    start_date: "",
    end_date: "",
  });

  const [formData, setFormData] = useState({
    project_id: "",
    vendor_id: null as number | null,
    category: "",
    deposit_amount: "",
    withdrawal_amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    memo: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("selectedWorkspaceId");
    if (saved) {
      const workspaceId = parseInt(saved);
      setSelectedWorkspaceId(workspaceId);
      fetchProjects(workspaceId);
      fetchVendors(workspaceId);
      fetchTransactions(workspaceId);
    }
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchTransactions(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId, filters]);

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
    }
  };

  const fetchVendors = async (workspaceId: number) => {
    try {
      const response = await fetch(`/api/vendors?workspace_id=${workspaceId}`);
      const data = await response.json();
      if (data.success) {
        setVendors(data.data);
      }
    } catch (error) {
      console.error("거래처 조회 오류:", error);
    }
  };

  const fetchTransactions = async (workspaceId: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspace_id: workspaceId.toString(),
        ...(filters.project_id && { project_id: filters.project_id }),
        ...(filters.category && { category: filters.category }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      });

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error("거래 내역 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedWorkspaceId) {
      setError("워크스페이스를 선택해주세요.");
      return;
    }

    if (!formData.project_id || !formData.category || !formData.transaction_date) {
      setError("필수 항목을 입력해주세요.");
      return;
    }

    if (!formData.deposit_amount && !formData.withdrawal_amount) {
      setError("입금액 또는 출금액을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: selectedWorkspaceId,
          project_id: formData.project_id,
          vendor_id: formData.vendor_id || null,
          category: formData.category,
          deposit_amount: parseFloat(formData.deposit_amount) || 0,
          withdrawal_amount: parseFloat(formData.withdrawal_amount) || 0,
          transaction_date: formData.transaction_date,
          memo: formData.memo || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          project_id: "",
          vendor_id: null,
          category: "",
          deposit_amount: "",
          withdrawal_amount: "",
          transaction_date: new Date().toISOString().split("T")[0],
          memo: "",
        });
        setShowAddForm(false);
        fetchTransactions(selectedWorkspaceId);
      } else {
        setError(data.message || "거래 내역 추가에 실패했습니다.");
      }
    } catch (error) {
      setError("거래 내역 추가 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success && selectedWorkspaceId) {
        fetchTransactions(selectedWorkspaceId);
      } else {
        setError(data.message || "거래 내역 삭제에 실패했습니다.");
      }
    } catch (error) {
      setError("거래 내역 삭제 중 오류가 발생했습니다.");
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

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">입출금 내역</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {showAddForm ? "취소" : "+ 거래 내역 추가"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* 필터 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-md grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              프로젝트
            </label>
            <select
              value={filters.project_id}
              onChange={(e) =>
                setFilters({ ...filters, project_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">전체</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              placeholder="카테고리"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작일
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters({ ...filters, start_date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종료일
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                setFilters({ ...filters, end_date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 *
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) =>
                    setFormData({ ...formData, project_id: e.target.value })
                  }
                  required
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                  placeholder="예: 식비, 교통비"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {selectedWorkspaceId && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거래처
                  </label>
                  <VendorAutocomplete
                    workspaceId={selectedWorkspaceId}
                    value={formData.vendor_id}
                    onChange={(vendorId, vendorName) => {
                      setFormData({ ...formData, vendor_id: vendorId });
                    }}
                    onManageClick={() => setShowVendorModal(true)}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입금액
                </label>
                <input
                  type="number"
                  value={formData.deposit_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit_amount: e.target.value })
                  }
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  출금액
                </label>
                <input
                  type="number"
                  value={formData.withdrawal_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      withdrawal_amount: e.target.value,
                    })
                  }
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  거래일자 *
                </label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transaction_date: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <input
                  type="text"
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData({ ...formData, memo: e.target.value })
                  }
                  placeholder="메모"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                추가
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래일자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    프로젝트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    입금액
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    출금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메모
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      거래 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => {
                    const project = projects.find(
                      (p) => p.id === transaction.project_id
                    );
                    const vendor = vendors.find(
                      (v) => v.id === transaction.vendor_id
                    );
                    return (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.transaction_date).toLocaleDateString(
                            "ko-KR"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project?.name || transaction.project_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {vendor?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                          {transaction.deposit_amount > 0
                            ? transaction.deposit_amount.toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                          {transaction.withdrawal_amount > 0
                            ? transaction.withdrawal_amount.toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {transaction.memo || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/transactions/${transaction.id}`}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            상세
                          </Link>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedWorkspaceId && (
        <VendorManagementModal
          workspaceId={selectedWorkspaceId}
          isOpen={showVendorModal}
          onClose={() => setShowVendorModal(false)}
          onVendorAdded={() => {
            fetchVendors(selectedWorkspaceId);
          }}
        />
      )}
    </Layout>
  );
}


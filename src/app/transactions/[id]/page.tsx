"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  description: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  receipts?: Receipt[];
}

interface Receipt {
  id: number;
  transaction_id: number;
  image_url: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

interface Vendor {
  id: number;
  name: string;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params?.id as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAddReceipt, setShowAddReceipt] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorAutocompleteKey, setVendorAutocompleteKey] = useState(0);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    project_id: "",
    vendor_id: null as number | null,
    category: "",
    deposit_amount: "",
    withdrawal_amount: "",
    transaction_date: "",
    description: "",
    memo: "",
  });

  const [receiptFormData, setReceiptFormData] = useState({
    image_url: "",
    file_name: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("selectedWorkspaceId");
    if (saved) {
      const workspaceId = parseInt(saved);
      setSelectedWorkspaceId(workspaceId);
      fetchProjects(workspaceId);
      fetchVendors(workspaceId);
    }
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  const fetchTransaction = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/transactions/${transactionId}`);
      const data = await response.json();

      if (data.success) {
        const trans = data.data;
        setTransaction(trans);
        setFormData({
          project_id: trans.project_id,
          vendor_id: trans.vendor_id,
          category: trans.category,
          deposit_amount: trans.deposit_amount?.toString() || "",
          withdrawal_amount: trans.withdrawal_amount?.toString() || "",
          transaction_date: trans.transaction_date,
          description: trans.description || "",
          memo: trans.memo || "",
        });
        setSelectedWorkspaceId(trans.workspace_id);
        fetchProjects(trans.workspace_id);
        fetchVendors(trans.workspace_id);
      } else {
        setError(data.message || "거래 내역을 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("거래 내역 조회 오류:", error);
      setError("거래 내역 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: formData.project_id,
          vendor_id: formData.vendor_id || null,
          category: formData.category,
          deposit_amount: parseFloat(formData.deposit_amount) || 0,
          withdrawal_amount: parseFloat(formData.withdrawal_amount) || 0,
          transaction_date: formData.transaction_date,
          description: formData.description || null,
          memo: formData.memo || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("거래 내역이 수정되었습니다.");
        setEditing(false);
        fetchTransaction();
      } else {
        setError(data.message || "거래 내역 수정에 실패했습니다.");
      }
    } catch (error) {
      setError("거래 내역 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/transactions");
      } else {
        setError(data.message || "거래 내역 삭제에 실패했습니다.");
      }
    } catch (error) {
      setError("거래 내역 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleAddReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!receiptFormData.image_url.trim()) {
      setError("이미지 URL을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: receiptFormData.image_url.trim(),
          file_name: receiptFormData.file_name || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("증빙서류가 추가되었습니다.");
        setReceiptFormData({ image_url: "", file_name: "" });
        setShowAddReceipt(false);
        fetchTransaction();
      } else {
        setError(data.message || "증빙서류 추가에 실패했습니다.");
      }
    } catch (error) {
      setError("증빙서류 추가 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteReceipt = async (receiptId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/transactions/receipts/${receiptId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("증빙서류가 삭제되었습니다.");
        fetchTransaction();
      } else {
        setError(data.message || "증빙서류 삭제에 실패했습니다.");
      }
    } catch (error) {
      setError("증빙서류 삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">로딩 중...</div>
      </Layout>
    );
  }

  if (!transaction) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">거래 내역을 찾을 수 없습니다.</p>
          <Link
            href="/transactions"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </Layout>
    );
  }

  const project = projects.find((p) => p.id === transaction.project_id);
  const vendor = vendors.find((v) => v.id === transaction.vendor_id);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">거래 내역 상세</h1>
          <div className="flex gap-2">
            {!editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  삭제
                </button>
              </>
            )}
            <Link
              href="/transactions"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              목록
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
        )}

        {success && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleUpdate} className="bg-white rounded-lg shadow p-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {selectedWorkspaceId && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거래처
                  </label>
                  <VendorAutocomplete
                    key={vendorAutocompleteKey}
                    workspaceId={selectedWorkspaceId}
                    value={formData.vendor_id}
                    onChange={(vendorId) => {
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
                  내역
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <input
                  type="text"
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData({ ...formData, memo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  fetchTransaction();
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">프로젝트</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {project?.name || transaction.project_id}
                  </p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">카테고리</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {transaction.category}
                  </p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">거래처</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {vendor?.name || "-"}
                  </p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">거래일자</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(transaction.transaction_date).toLocaleDateString(
                      "ko-KR"
                    )}
                  </p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">입금액</p>
                  <p className="text-lg font-semibold text-green-600">
                    {transaction.deposit_amount > 0
                      ? transaction.deposit_amount.toLocaleString() + "원"
                      : "-"}
                  </p>
                </div>
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-1">출금액</p>
                  <p className="text-lg font-semibold text-red-600">
                    {transaction.withdrawal_amount > 0
                      ? transaction.withdrawal_amount.toLocaleString() + "원"
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">내역</p>
                <p className="text-lg font-semibold text-gray-900">
                  {transaction.description || "-"}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">메모</p>
                <p className="text-lg font-semibold text-gray-900">
                  {transaction.memo || "-"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 증빙서류 섹션 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">증빙서류</h2>
            {!editing && (
              <button
                onClick={() => setShowAddReceipt(!showAddReceipt)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {showAddReceipt ? "취소" : "+ 증빙서류 추가"}
              </button>
            )}
          </div>

          {showAddReceipt && (
            <form
              onSubmit={handleAddReceipt}
              className="mb-6 p-4 bg-gray-50 rounded-md"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이미지 URL *
                  </label>
                  <input
                    type="url"
                    value={receiptFormData.image_url}
                    onChange={(e) =>
                      setReceiptFormData({
                        ...receiptFormData,
                        image_url: e.target.value,
                      })
                    }
                    required
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    파일명
                  </label>
                  <input
                    type="text"
                    value={receiptFormData.file_name}
                    onChange={(e) =>
                      setReceiptFormData({
                        ...receiptFormData,
                        file_name: e.target.value,
                      })
                    }
                    placeholder="선택사항"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  추가
                </button>
              </div>
            </form>
          )}

          {transaction.receipts && transaction.receipts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {transaction.receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border border-gray-200 rounded-md p-4 relative"
                >
                  <img
                    src={receipt.image_url}
                    alt={receipt.file_name || "증빙서류"}
                    className="w-full h-48 object-cover rounded-md mb-2"
                  />
                  {receipt.file_name && (
                    <p className="text-sm text-gray-600 mb-2">
                      {receipt.file_name}
                    </p>
                  )}
                  {!editing && (
                    <button
                      onClick={() => handleDeleteReceipt(receipt.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              증빙서류가 없습니다.
            </p>
          )}
        </div>
      </div>

      {selectedWorkspaceId && (
        <VendorManagementModal
          workspaceId={selectedWorkspaceId}
          isOpen={showVendorModal}
          onClose={() => setShowVendorModal(false)}
          onVendorAdded={() => {
            fetchVendors(selectedWorkspaceId);
            setVendorAutocompleteKey((prev) => prev + 1);
          }}
        />
      )}
    </Layout>
  );
}


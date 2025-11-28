"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

interface Document {
  id: number;
  workspace_id: number;
  document_type: string;
  title: string;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  expiry_date: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null
  );
  const [filterType, setFilterType] = useState("");

  const [formData, setFormData] = useState({
    document_type: "",
    title: "",
    file_url: "",
    file_name: "",
    expiry_date: "",
    memo: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("selectedWorkspaceId");
    if (saved) {
      const workspaceId = parseInt(saved);
      setSelectedWorkspaceId(workspaceId);
      fetchDocuments(workspaceId);
    }
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchDocuments(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId, filterType]);

  const fetchDocuments = async (workspaceId: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspace_id: workspaceId.toString(),
        ...(filterType && { document_type: filterType }),
      });

      const response = await fetch(`/api/documents?${params}`);
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error("서류 조회 오류:", error);
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

    if (!formData.document_type.trim() || !formData.title.trim() || !formData.file_url.trim()) {
      setError("서류 종류, 제목, 파일 URL을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: selectedWorkspaceId,
          document_type: formData.document_type.trim(),
          title: formData.title.trim(),
          file_url: formData.file_url.trim(),
          file_name: formData.file_name || null,
          expiry_date: formData.expiry_date || null,
          memo: formData.memo || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          document_type: "",
          title: "",
          file_url: "",
          file_name: "",
          expiry_date: "",
          memo: "",
        });
        setShowAddForm(false);
        fetchDocuments(selectedWorkspaceId);
      } else {
        setError(data.message || "서류 추가에 실패했습니다.");
      }
    } catch (error) {
      setError("서류 추가 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success && selectedWorkspaceId) {
        fetchDocuments(selectedWorkspaceId);
      } else {
        setError(data.message || "서류 삭제에 실패했습니다.");
      }
    } catch (error) {
      setError("서류 삭제 중 오류가 발생했습니다.");
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

  const documentTypes = [
    "사업자등록증",
    "임대차계약서",
    "통장사본",
    "인감증명서",
    "기타",
  ];

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">서류 관리</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {showAddForm ? "취소" : "+ 서류 추가"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* 필터 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            서류 종류 필터
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">전체</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {showAddForm && (
          <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  서류 종류 *
                </label>
                <select
                  value={formData.document_type}
                  onChange={(e) =>
                    setFormData({ ...formData, document_type: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">선택하세요</option>
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="서류 제목"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  파일 URL *
                </label>
                <input
                  type="url"
                  value={formData.file_url}
                  onChange={(e) =>
                    setFormData({ ...formData, file_url: e.target.value })
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
                  value={formData.file_name}
                  onChange={(e) =>
                    setFormData({ ...formData, file_name: e.target.value })
                  }
                  placeholder="원본 파일명"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  유효기간
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <textarea
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData({ ...formData, memo: e.target.value })
                  }
                  rows={3}
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
                    서류 종류
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    파일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유효기간
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
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      서류가 없습니다.
                    </td>
                  </tr>
                ) : (
                  documents.map((document) => (
                    <tr key={document.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {document.document_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {document.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a
                          href={document.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {document.file_name || "파일 보기"}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.expiry_date
                          ? new Date(document.expiry_date).toLocaleDateString(
                              "ko-KR"
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {document.memo || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(document.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}


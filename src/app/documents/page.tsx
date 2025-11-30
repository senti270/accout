"use client";

import { useEffect, useState, useRef } from "react";
import Layout from "@/components/Layout";

interface Document {
  id: number;
  workspace_id: number;
  project_id: string | null;
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
  const [searchTitle, setSearchTitle] = useState("");

  const [formData, setFormData] = useState({
    document_type: "",
    title: "",
    file_url: "",
    file_name: "",
    memo: "",
  });

  const [pendingFile, setPendingFile] = useState<{
    base64: string;
    file: File;
  } | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("selectedWorkspaceId");
    if (saved) {
      const workspaceId = parseInt(saved);
      setSelectedWorkspaceId(workspaceId);
      fetchDocuments(workspaceId);
    }
  }, []);

  useEffect(() => {
    // 워크스페이스 변경 이벤트 구독
    const handleWorkspaceChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ workspaceId: number }>;
      const newWorkspaceId = customEvent.detail?.workspaceId;
      if (newWorkspaceId) {
        setSelectedWorkspaceId(newWorkspaceId);
        fetchDocuments(newWorkspaceId);
      }
    };

    window.addEventListener("workspaceChanged", handleWorkspaceChange);

    return () => {
      window.removeEventListener("workspaceChanged", handleWorkspaceChange);
    };
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchDocuments(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId, filterType, searchTitle]);

  const fetchDocuments = async (workspaceId: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspace_id: workspaceId.toString(),
        ...(filterType && { document_type: filterType }),
        ...(searchTitle && { title: searchTitle }),
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

    if (!formData.document_type.trim() || !formData.title.trim()) {
      setError("서류 종류, 제목을 입력해주세요.");
      return;
    }

    if (!pendingFile && !formData.file_url.trim()) {
      setError("파일을 첨부하거나 파일 URL을 입력해주세요.");
      return;
    }

    try {
      // 파일이 있으면 base64를 사용, 없으면 URL 사용
      const fileUrl = pendingFile
        ? pendingFile.base64
        : formData.file_url.trim();
      const fileName = pendingFile
        ? pendingFile.file.name
        : formData.file_name || null;
      const fileSize = pendingFile ? pendingFile.file.size : null;
      const mimeType = pendingFile ? pendingFile.file.type : null;

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: selectedWorkspaceId,
          document_type: formData.document_type.trim(),
          title: formData.title.trim(),
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          mime_type: mimeType,
          expiry_date: null,
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
          memo: "",
        });
        setPendingFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setShowAddForm(false);
        fetchDocuments(selectedWorkspaceId);
      } else {
        setError(data.message || "서류 추가에 실패했습니다.");
      }
    } catch (error) {
      setError("서류 추가 중 오류가 발생했습니다.");
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleImageFile(file);
        }
      }
    }
  };

  const handleImageFile = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          setPendingFile({ base64, file });
          setFormData((prev) => ({
            ...prev,
            file_name: file.name,
          }));
          resolve();
        } catch (error) {
          console.error("이미지 처리 오류:", error);
          setError("이미지 처리 중 오류가 발생했습니다.");
          reject();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageFile(file);
    }
  };

  const handleRemoveFile = () => {
    setPendingFile(null);
    setFormData((prev) => ({
      ...prev,
      file_url: "",
      file_name: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  const handleFileDownload = (doc: Document) => {
    if (!doc.file_url) return;
    
    // base64 데이터인 경우
    if (doc.file_url.startsWith("data:")) {
      try {
        // base64 데이터에서 MIME 타입과 데이터 추출
        const base64Data = doc.file_url.split(",")[1];
        const mimeType = doc.file_url.split(",")[0].split(":")[1].split(";")[0];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        // 파일 다운로드
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.file_name || doc.title || "파일";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("파일 다운로드 오류:", error);
        setError("파일 다운로드 중 오류가 발생했습니다.");
      }
    } else {
      // 일반 URL인 경우 새 창에서 열기
      window.open(doc.file_url, "_blank");
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
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              서류 종류 필터
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">전체</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 검색
            </label>
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="제목으로 검색"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAdd}
            className="mb-6 p-4 bg-gray-50 rounded-md"
            onPaste={handlePaste}
          >
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
                  파일 첨부 * (또는 파일 URL 입력)
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {pendingFile && (
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        제거
                      </button>
                    )}
                  </div>
                  {!pendingFile && (
                    <input
                      type="url"
                      value={formData.file_url}
                      onChange={(e) =>
                        setFormData({ ...formData, file_url: e.target.value })
                      }
                      placeholder="또는 파일 URL 입력 (https://... 또는 base64 data URL)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                  {pendingFile && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {pendingFile.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(pendingFile.file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        {pendingFile.file.type.startsWith("image/") && (
                          <img
                            src={pendingFile.base64}
                            alt="미리보기"
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 이미지를 복사하여 붙여넣을 수도 있습니다 (Ctrl+V / Cmd+V)
                      </p>
                    </div>
                  )}
                </div>
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
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
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
                        <button
                          onClick={() => handleFileDownload(document)}
                          className="text-indigo-600 hover:text-indigo-900 underline"
                        >
                          {document.file_name || "파일 보기"}
                        </button>
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


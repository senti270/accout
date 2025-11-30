"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import Layout from "@/components/Layout";

interface Project {
  id: string;
  workspace_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    memo: "",
  });

  const [editData, setEditData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    memo: "",
  });

  const [error, setError] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    null
  );
  const [projectDocuments, setProjectDocuments] = useState<{
    [key: string]: Document[];
  }>({});
  const [showDocumentForm, setShowDocumentForm] = useState<string | null>(null);
  const [documentFormData, setDocumentFormData] = useState({
    document_type: "",
    title: "",
    file_url: "",
    file_name: "",
    expiry_date: "",
    memo: "",
  });
  const [pendingFile, setPendingFile] = useState<{
    base64: string;
    file: File;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const documentTypes = [
    "사업자등록증",
    "임대차계약서",
    "통장사본",
    "인감증명서",
    "계약서",
    "기타",
  ];

  useEffect(() => {
    const saved = localStorage.getItem("selectedWorkspaceId");
    if (saved) {
      const workspaceId = parseInt(saved);
      setSelectedWorkspaceId(workspaceId);
      fetchProjects(workspaceId);
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
      }
    };

    window.addEventListener("workspaceChanged", handleWorkspaceChange);

    return () => {
      window.removeEventListener("workspaceChanged", handleWorkspaceChange);
    };
  }, []);

  const fetchProjects = async (workspaceId: number) => {
    setLoading(true);
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedWorkspaceId) {
      setError("워크스페이스를 선택해주세요.");
      return;
    }

    if (!formData.name.trim()) {
      setError("프로젝트명을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: selectedWorkspaceId,
          name: formData.name.trim(),
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          memo: formData.memo || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          name: "",
          start_date: "",
          end_date: "",
          memo: "",
        });
        setShowAddForm(false);
        fetchProjects(selectedWorkspaceId);
      } else {
        setError(data.message || "프로젝트 생성에 실패했습니다.");
      }
    } catch (error) {
      setError("프로젝트 생성 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setEditData({
      name: project.name,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      memo: project.memo || "",
    });
  };

  const handleUpdate = async (id: string) => {
    setError("");

    if (!editData.name.trim()) {
      setError("프로젝트명을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name.trim(),
          start_date: editData.start_date || null,
          end_date: editData.end_date || null,
          memo: editData.memo || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        setEditData({ name: "", start_date: "", end_date: "", memo: "" });
        if (selectedWorkspaceId) {
          fetchProjects(selectedWorkspaceId);
        }
      } else {
        setError(data.message || "프로젝트 수정에 실패했습니다.");
      }
    } catch (error) {
      setError("프로젝트 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 관련된 모든 거래 내역도 삭제됩니다.")) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success && selectedWorkspaceId) {
        fetchProjects(selectedWorkspaceId);
      } else {
        setError(data.message || "프로젝트 삭제에 실패했습니다.");
      }
    } catch (error) {
      setError("프로젝트 삭제 중 오류가 발생했습니다.");
    }
  };

  const fetchProjectDocuments = async (projectId: string) => {
    if (!selectedWorkspaceId) return;

    try {
      const params = new URLSearchParams({
        workspace_id: selectedWorkspaceId.toString(),
        project_id: projectId,
      });
      const response = await fetch(`/api/documents?${params}`);
      const data = await response.json();
      if (data.success) {
        setProjectDocuments((prev) => ({
          ...prev,
          [projectId]: data.data,
        }));
      }
    } catch (error) {
      console.error("프로젝트 서류 조회 오류:", error);
    }
  };

  const handleToggleDocuments = (projectId: string) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      setShowDocumentForm(null);
    } else {
      setExpandedProjectId(projectId);
      if (!projectDocuments[projectId]) {
        fetchProjectDocuments(projectId);
      }
      setShowDocumentForm(null);
    }
  };

  const handlePaste = async (
    e: React.ClipboardEvent<HTMLDivElement>,
    projectId: string
  ) => {
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
          setDocumentFormData((prev) => ({
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
    setDocumentFormData((prev) => ({
      ...prev,
      file_url: "",
      file_name: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddDocument = async (
    e: React.FormEvent,
    projectId: string
  ) => {
    e.preventDefault();
    setError("");

    if (!selectedWorkspaceId) {
      setError("워크스페이스를 선택해주세요.");
      return;
    }

    if (!documentFormData.document_type.trim() || !documentFormData.title.trim()) {
      setError("서류 종류, 제목을 입력해주세요.");
      return;
    }

    if (!pendingFile && !documentFormData.file_url.trim()) {
      setError("파일을 첨부하거나 파일 URL을 입력해주세요.");
      return;
    }

    try {
      const fileUrl = pendingFile
        ? pendingFile.base64
        : documentFormData.file_url.trim();
      const fileName = pendingFile
        ? pendingFile.file.name
        : documentFormData.file_name || null;
      const fileSize = pendingFile ? pendingFile.file.size : null;
      const mimeType = pendingFile ? pendingFile.file.type : null;

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: selectedWorkspaceId,
          project_id: projectId,
          document_type: documentFormData.document_type.trim(),
          title: documentFormData.title.trim(),
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          mime_type: mimeType,
          expiry_date: documentFormData.expiry_date || null,
          memo: documentFormData.memo || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDocumentFormData({
          document_type: "",
          title: "",
          file_url: "",
          file_name: "",
          expiry_date: "",
          memo: "",
        });
        setPendingFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setShowDocumentForm(null);
        fetchProjectDocuments(projectId);
      } else {
        setError(data.message || "서류 추가에 실패했습니다.");
      }
    } catch (error) {
      setError("서류 추가 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteDocument = async (
    documentId: number,
    projectId: string
  ) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchProjectDocuments(projectId);
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

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {showAddForm ? "취소" : "+ 프로젝트 추가"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트명 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="프로젝트 이름"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작일
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
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
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
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
                  placeholder="프로젝트 메모"
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
                    프로젝트명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기간
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
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      프로젝트가 없습니다.
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <Fragment key={project.id}>
                      <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === project.id ? (
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            autoFocus
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">
                            {project.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === project.id ? (
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={editData.start_date}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  start_date: e.target.value,
                                })
                              }
                              className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-gray-400">~</span>
                            <input
                              type="date"
                              value={editData.end_date}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  end_date: e.target.value,
                                })
                              }
                              className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        ) : (
                          <div>
                            {project.start_date
                              ? new Date(project.start_date).toLocaleDateString(
                                  "ko-KR"
                                )
                              : "-"}{" "}
                            ~{" "}
                            {project.end_date
                              ? new Date(project.end_date).toLocaleDateString(
                                  "ko-KR"
                                )
                              : "-"}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {editingId === project.id ? (
                          <textarea
                            value={editData.memo}
                            onChange={(e) =>
                              setEditData({ ...editData, memo: e.target.value })
                            }
                            rows={2}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <div className="max-w-xs truncate">
                            {project.memo || "-"}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === project.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdate(project.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditData({
                                  name: "",
                                  start_date: "",
                                  end_date: "",
                                  memo: "",
                                });
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleToggleDocuments(project.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {expandedProjectId === project.id ? "서류 숨기기" : "서류"}
                            </button>
                            <button
                              onClick={() => handleEdit(project)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedProjectId === project.id && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold text-gray-900">
                                서류
                              </h3>
                              {!showDocumentForm && (
                                <button
                                  onClick={() => setShowDocumentForm(project.id)}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                                >
                                  + 서류 추가
                                </button>
                              )}
                            </div>

                            {showDocumentForm === project.id && (
                              <form
                                onSubmit={(e) => handleAddDocument(e, project.id)}
                                className="p-4 bg-white rounded-md border border-gray-200"
                                onPaste={(e) => handlePaste(e, project.id)}
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      서류 종류 *
                                    </label>
                                    <select
                                      value={documentFormData.document_type}
                                      onChange={(e) =>
                                        setDocumentFormData({
                                          ...documentFormData,
                                          document_type: e.target.value,
                                        })
                                      }
                                      required
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
                                      value={documentFormData.title}
                                      onChange={(e) =>
                                        setDocumentFormData({
                                          ...documentFormData,
                                          title: e.target.value,
                                        })
                                      }
                                      required
                                      placeholder="서류 제목"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                        {pendingFile && (
                                          <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                                          >
                                            제거
                                          </button>
                                        )}
                                      </div>
                                      {!pendingFile && (
                                        <input
                                          type="url"
                                          value={documentFormData.file_url}
                                          onChange={(e) =>
                                            setDocumentFormData({
                                              ...documentFormData,
                                              file_url: e.target.value,
                                            })
                                          }
                                          placeholder="또는 파일 URL 입력"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                      )}
                                      {pendingFile && (
                                        <div className="p-3 bg-blue-50 rounded-md">
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
                                            💡 이미지를 복사하여 붙여넣을 수도 있습니다
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      유효기간
                                    </label>
                                    <input
                                      type="date"
                                      value={documentFormData.expiry_date}
                                      onChange={(e) =>
                                        setDocumentFormData({
                                          ...documentFormData,
                                          expiry_date: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      메모
                                    </label>
                                    <textarea
                                      value={documentFormData.memo}
                                      onChange={(e) =>
                                        setDocumentFormData({
                                          ...documentFormData,
                                          memo: e.target.value,
                                        })
                                      }
                                      rows={2}
                                      placeholder="메모"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                  <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                                  >
                                    추가
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowDocumentForm(null);
                                      setDocumentFormData({
                                        document_type: "",
                                        title: "",
                                        file_url: "",
                                        file_name: "",
                                        expiry_date: "",
                                        memo: "",
                                      });
                                      setPendingFile(null);
                                      if (fileInputRef.current) {
                                        fileInputRef.current.value = "";
                                      }
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                                  >
                                    취소
                                  </button>
                                </div>
                              </form>
                            )}

                            {projectDocuments[project.id] &&
                            projectDocuments[project.id].length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projectDocuments[project.id].map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="p-4 bg-white rounded-md border border-gray-200"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {doc.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {doc.document_type}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleDeleteDocument(doc.id, project.id)
                                        }
                                        className="text-red-600 hover:text-red-900 text-sm"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                    {doc.file_url &&
                                      (doc.mime_type?.startsWith("image/") ||
                                        doc.file_url.startsWith("data:image/")) && (
                                        <img
                                          src={doc.file_url}
                                          alt={doc.title}
                                          className="w-full h-32 object-cover rounded-md mb-2"
                                        />
                                      )}
                                    {doc.file_url && !doc.mime_type?.startsWith("image/") && (
                                      <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                                      >
                                        {doc.file_name || "파일 보기"}
                                      </a>
                                    )}
                                    {doc.expiry_date && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        유효기간:{" "}
                                        {new Date(doc.expiry_date).toLocaleDateString("ko-KR")}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-4">
                                서류가 없습니다.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
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


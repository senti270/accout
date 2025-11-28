"use client";

import { useEffect, useState } from "react";
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
    id: "",
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

  useEffect(() => {
    const saved = localStorage.getItem("selectedWorkspaceId");
    if (saved) {
      const workspaceId = parseInt(saved);
      setSelectedWorkspaceId(workspaceId);
      fetchProjects(workspaceId);
    }
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

    if (!formData.id.trim() || !formData.name.trim()) {
      setError("프로젝트 아이디와 이름을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formData.id.trim(),
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
          id: "",
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
                  프로젝트 아이디 *
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value })
                  }
                  required
                  placeholder="예: PROJ-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
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
                    프로젝트 아이디
                  </th>
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
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      프로젝트가 없습니다.
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {project.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === project.id ? (
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
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


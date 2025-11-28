"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

interface Workspace {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/workspaces");
      const data = await response.json();
      if (data.success) {
        setWorkspaces(data.data);
      }
    } catch (error) {
      console.error("워크스페이스 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newWorkspaceName.trim()) {
      setError("워크스페이스 이름을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setNewWorkspaceName("");
        setShowAddForm(false);
        fetchWorkspaces();
      } else {
        setError(data.message || "워크스페이스 생성에 실패했습니다.");
      }
    } catch (error) {
      setError("워크스페이스 생성 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setEditName(workspace.name);
  };

  const handleUpdate = async (id: number) => {
    setError("");

    if (!editName.trim()) {
      setError("워크스페이스 이름을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        setEditName("");
        fetchWorkspaces();
      } else {
        setError(data.message || "워크스페이스 수정에 실패했습니다.");
      }
    } catch (error) {
      setError("워크스페이스 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까? 관련된 모든 데이터가 삭제됩니다.")) {
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchWorkspaces();
        // 선택된 워크스페이스가 삭제되면 선택 해제
        const selected = localStorage.getItem("selectedWorkspaceId");
        if (selected && parseInt(selected) === id) {
          localStorage.removeItem("selectedWorkspaceId");
          window.location.reload();
        }
      } else {
        setError(data.message || "워크스페이스 삭제에 실패했습니다.");
      }
    } catch (error) {
      setError("워크스페이스 삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">로딩 중...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">워크스페이스 관리</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {showAddForm ? "취소" : "+ 워크스페이스 추가"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="flex gap-2">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="워크스페이스 이름"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                추가
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workspaces.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    워크스페이스가 없습니다.
                  </td>
                </tr>
              ) : (
                workspaces.map((workspace) => (
                  <tr key={workspace.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === workspace.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          {workspace.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(workspace.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === workspace.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(workspace.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditName("");
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(workspace)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(workspace.id)}
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
      </div>
    </Layout>
  );
}


"use client";

import { useEffect, useState } from "react";

interface Workspace {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface WorkspaceSelectorProps {
  selectedWorkspaceId: number | null;
  onWorkspaceChange: (workspaceId: number | null) => void;
}

export default function WorkspaceSelector({
  selectedWorkspaceId,
  onWorkspaceChange,
}: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/workspaces");
      const data = await response.json();
      if (data.success) {
        setWorkspaces(data.data);
        // 첫 번째 워크스페이스 자동 선택
        if (data.data.length > 0 && !selectedWorkspaceId) {
          onWorkspaceChange(data.data[0].id);
        }
      }
    } catch (error) {
      console.error("워크스페이스 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-600">로딩 중...</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="workspace" className="text-sm font-medium text-gray-700">
        워크스페이스:
      </label>
      <select
        id="workspace"
        value={selectedWorkspaceId || ""}
        onChange={(e) =>
          onWorkspaceChange(e.target.value ? parseInt(e.target.value) : null)
        }
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="">선택하세요</option>
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
    </div>
  );
}


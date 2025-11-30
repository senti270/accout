"use client";

import { useEffect, useState } from "react";

interface Bookmark {
  id: number;
  workspace_id: number;
  title: string;
  url: string;
  created_at: string;
  updated_at: string;
}

interface DashboardBookmarksProps {
  workspaceId: number;
}

export default function DashboardBookmarks({
  workspaceId,
}: DashboardBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookmarks();
  }, [workspaceId]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookmarks?workspace_id=${workspaceId}`);
      const data = await response.json();
      if (data.success) {
        setBookmarks(data.data);
      }
    } catch (error) {
      console.error("URL 바로가기 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    if (!formData.url.trim()) {
      setError("URL을 입력해주세요.");
      return;
    }

    try {
      const url = editingId
        ? `/api/bookmarks/${editingId}`
        : "/api/bookmarks";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId ? {} : { workspace_id: workspaceId }),
          title: formData.title.trim(),
          url: formData.url.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({ title: "", url: "" });
        setShowAddForm(false);
        setEditingId(null);
        fetchBookmarks();
      } else {
        setError(data.message || "URL 바로가기 저장에 실패했습니다.");
      }
    } catch (error) {
      setError("URL 바로가기 저장 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (bookmark: Bookmark) => {
    setFormData({
      title: bookmark.title,
      url: bookmark.url,
    });
    setEditingId(bookmark.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 URL 바로가기를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchBookmarks();
      } else {
        alert(data.message || "URL 바로가기 삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("URL 바로가기 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleCancel = () => {
    setFormData({ title: "", url: "" });
    setShowAddForm(false);
    setEditingId(null);
  };

  if (loading) {
    return <div className="text-center py-4">로딩 중...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">URL 바로가기</h2>
        <button
          onClick={() => {
            if (showAddForm) {
              handleCancel();
            } else {
              setShowAddForm(true);
            }
          }}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
        >
          {showAddForm ? "취소" : "추가"}
        </button>
      </div>

      {/* URL 바로가기 추가/수정 폼 */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-md">
          <div className="space-y-3">
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="제목 *"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              placeholder="URL * (예: https://www.notion.so/...)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                {editingId ? "수정" : "등록"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                취소
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      )}

      {/* URL 바로가기 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookmarks.length === 0 ? (
          <p className="text-gray-500 text-center py-8 col-span-full">
            URL 바로가기가 없습니다.
          </p>
        ) : (
          bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 group"
                >
                  <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 truncate">
                    {bookmark.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {bookmark.url}
                  </p>
                </a>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleEdit(bookmark)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(bookmark.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


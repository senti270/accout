"use client";

import { useEffect, useState } from "react";

interface Todo {
  id: number;
  workspace_id: number;
  title: string;
  content: string | null;
  due_date: string | null;
  is_completed: number | boolean;
  created_at: string;
  updated_at: string;
}

interface TodoAttachment {
  id: number;
  todo_id: number;
  image_url: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

interface DashboardTodosProps {
  workspaceId: number;
}

export default function DashboardTodos({ workspaceId }: DashboardTodosProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    due_date: "",
  });
  const [attachments, setAttachments] = useState<{
    [key: number]: TodoAttachment[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTodos();
  }, [workspaceId]);

  useEffect(() => {
    // 각 할일의 첨부파일 조회
    todos.forEach((todo) => {
      if (!attachments[todo.id]) {
        fetchAttachments(todo.id);
      }
    });
  }, [todos]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/todos?workspace_id=${workspaceId}`);
      const data = await response.json();
      if (data.success) {
        setTodos(data.data);
      }
    } catch (error) {
      console.error("Todolist 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async (todoId: number) => {
    try {
      const response = await fetch(`/api/todos/${todoId}/attachments`);
      const data = await response.json();
      if (data.success) {
        setAttachments((prev) => ({ ...prev, [todoId]: data.data }));
      }
    } catch (error) {
      console.error("첨부파일 조회 오류:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          title: formData.title.trim(),
          content: formData.content.trim() || null,
          due_date: formData.due_date || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({ title: "", content: "", due_date: "" });
        setShowAddForm(false);
        fetchTodos();
      } else {
        setError(data.message || "할일 생성에 실패했습니다.");
      }
    } catch (error) {
      setError("할일 생성 중 오류가 발생했습니다.");
    }
  };

  const handleToggleComplete = async (id: number, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_completed: !isCompleted,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchTodos();
      }
    } catch (error) {
      console.error("완료 상태 변경 오류:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 할일을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchTodos();
      } else {
        alert(data.message || "할일 삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("할일 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteAttachment = async (todoId: number, attachmentId: number) => {
    if (!confirm("이 첨부파일을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(
        `/api/todos/${todoId}/attachments/${attachmentId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        fetchAttachments(todoId);
      } else {
        alert(data.message || "첨부파일 삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("첨부파일 삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return <div className="text-center py-4">로딩 중...</div>;
  }

  const incompleteTodos = todos.filter(
    (todo) => !todo.is_completed || todo.is_completed === 0
  );
  const completedTodos = todos.filter(
    (todo) => todo.is_completed && todo.is_completed !== 0
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">할일 목록</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
        >
          {showAddForm ? "취소" : "추가"}
        </button>
      </div>

      {/* 할일 추가 폼 */}
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
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="내용 (선택)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="file"
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                등록
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ title: "", content: "", due_date: "" });
                  setShowAddForm(false);
                }}
                className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                취소
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      )}

      {/* 할일 목록 */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">할일이 없습니다.</p>
        ) : (
          <>
            {/* 미완료 할일 */}
            {incompleteTodos.map((todo) => {
              const isCompleted = todo.is_completed === 1 || todo.is_completed === true;
              return (
                <div
                  key={todo.id}
                  className="border border-gray-200 rounded-md p-4"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleToggleComplete(todo.id, isCompleted)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3
                        className={`font-medium ${
                          isCompleted ? "line-through text-gray-400" : "text-gray-900"
                        }`}
                      >
                        {todo.title}
                      </h3>
                      {todo.content && (
                        <p className="text-sm text-gray-600 mt-1">{todo.content}</p>
                      )}
                      {todo.due_date && (
                        <p
                          className={`text-xs mt-1 ${
                            new Date(todo.due_date) < new Date() && !isCompleted
                              ? "text-red-500"
                              : "text-gray-500"
                          }`}
                        >
                          마감일: {new Date(todo.due_date).toLocaleDateString("ko-KR")}
                        </p>
                      )}
                      {/* 첨부파일 표시 */}
                      {attachments[todo.id]?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {attachments[todo.id].map((attachment) => (
                            <div key={attachment.id} className="relative">
                              <img
                                src={attachment.image_url}
                                alt={attachment.file_name || "첨부파일"}
                                className="max-w-xs max-h-24 rounded border border-gray-300"
                              />
                              <button
                                onClick={() =>
                                  handleDeleteAttachment(todo.id, attachment.id)
                                }
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
            {/* 완료된 할일 */}
            {completedTodos.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">
                  완료된 할일 ({completedTodos.length})
                </summary>
                <div className="mt-2 space-y-3">
                  {completedTodos.map((todo) => {
                    const isCompleted = todo.is_completed === 1 || todo.is_completed === true;
                    return (
                      <div
                        key={todo.id}
                        className="border border-gray-200 rounded-md p-4 opacity-60"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={() =>
                              handleToggleComplete(todo.id, isCompleted)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium line-through text-gray-400">
                              {todo.title}
                            </h3>
                            {todo.content && (
                              <p className="text-sm text-gray-600 mt-1">
                                {todo.content}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(todo.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}


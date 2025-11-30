"use client";

import { useEffect, useState, useRef } from "react";

interface Comment {
  id: number;
  workspace_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

interface CommentAttachment {
  id: number;
  comment_id: number;
  image_url: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

interface DashboardCommentsProps {
  workspaceId: number;
}

export default function DashboardComments({
  workspaceId,
}: DashboardCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [pendingImages, setPendingImages] = useState<Array<{ base64: string; file: File }>>([]);
  const [attachments, setAttachments] = useState<{
    [key: number]: CommentAttachment[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [workspaceId]);

  useEffect(() => {
    // 각 코멘트의 첨부파일 조회
    comments.forEach((comment) => {
      if (!attachments[comment.id]) {
        fetchAttachments(comment.id);
      }
    });
  }, [comments]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comments?workspace_id=${workspaceId}`);
      const data = await response.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error("코멘트 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async (commentId: number) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/attachments`);
      const data = await response.json();
      if (data.success) {
        setAttachments((prev) => ({ ...prev, [commentId]: data.data }));
      }
    } catch (error) {
      console.error("첨부파일 조회 오류:", error);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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
          // 임시 이미지 목록에 추가
          setPendingImages((prev) => [...prev, { base64, file }]);
          resolve();
        } catch (error) {
          console.error("이미지 처리 오류:", error);
          reject();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await handleImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newComment.trim() && pendingImages.length === 0) {
      setError("코멘트 내용 또는 이미지를 입력해주세요.");
      return;
    }

    try {
      // 코멘트 생성
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          content: newComment.trim() || "(이미지 첨부)",
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const commentId = data.data.id;
        
        // 첨부파일 추가
        for (const image of pendingImages) {
          await fetch(`/api/comments/${commentId}/attachments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: image.base64,
              file_name: image.file.name,
              file_size: image.file.size,
              mime_type: image.file.type,
            }),
          });
        }

        setNewComment("");
        setPendingImages([]);
        fetchComments();
      } else {
        setError(data.message || "코멘트 생성에 실패했습니다.");
      }
    } catch (error) {
      setError("코멘트 생성 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 코멘트를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchComments();
      } else {
        alert(data.message || "코멘트 삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("코멘트 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteAttachment = async (
    commentId: number,
    attachmentId: number
  ) => {
    if (!confirm("이 첨부파일을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(
        `/api/comments/${commentId}/attachments/${attachmentId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        fetchAttachments(commentId);
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">코멘트</h2>

      {/* 코멘트 작성 폼 */}
      <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onPaste={handlePaste}
            placeholder="코멘트를 입력하세요... (이미지 붙여넣기 가능)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            rows={3}
          />
          {/* 임시 이미지 미리보기 */}
          {pendingImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.base64}
                    alt="미리보기"
                    className="max-w-xs max-h-24 rounded border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPendingImages((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="comment-file-input"
            />
            <label
              htmlFor="comment-file-input"
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer text-sm"
            >
              파일 첨부
            </label>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              등록
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>

      {/* 코멘트 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">코멘트가 없습니다.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border-b border-gray-200 pb-4 last:border-b-0"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(comment.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  삭제
                </button>
              </div>
              {/* 첨부파일 표시 */}
              {attachments[comment.id]?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachments[comment.id].map((attachment) => (
                    <div key={attachment.id} className="relative">
                      <img
                        src={attachment.image_url}
                        alt={attachment.file_name || "첨부파일"}
                        className="max-w-xs max-h-32 rounded border border-gray-300"
                      />
                      <button
                        onClick={() =>
                          handleDeleteAttachment(comment.id, attachment.id)
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
          ))
        )}
      </div>
    </div>
  );
}


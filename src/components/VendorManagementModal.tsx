"use client";

import { useEffect, useState } from "react";

interface Vendor {
  id: number;
  workspace_id: number;
  business_number: string | null;
  name: string;
  contact_person: string | null;
  contact_phone: string | null;
  tax_email: string | null;
  created_at: string;
  updated_at: string;
}

interface VendorManagementModalProps {
  workspaceId: number;
  isOpen: boolean;
  onClose: () => void;
  onVendorAdded?: () => void;
}

export default function VendorManagementModal({
  workspaceId,
  isOpen,
  onClose,
  onVendorAdded,
}: VendorManagementModalProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    business_number: "",
    name: "",
    contact_person: "",
    contact_phone: "",
    tax_email: "",
  });

  const [editData, setEditData] = useState({
    business_number: "",
    name: "",
    contact_person: "",
    contact_phone: "",
    tax_email: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen, workspaceId]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vendors?workspace_id=${workspaceId}`);
      const data = await response.json();
      if (data.success) {
        setVendors(data.data);
      }
    } catch (error) {
      console.error("거래처 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("거래처명을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          business_number: formData.business_number || null,
          name: formData.name.trim(),
          contact_person: formData.contact_person || null,
          contact_phone: formData.contact_phone || null,
          tax_email: formData.tax_email || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          business_number: "",
          name: "",
          contact_person: "",
          contact_phone: "",
          tax_email: "",
        });
        setShowAddForm(false);
        fetchVendors();
        if (onVendorAdded) {
          onVendorAdded();
        }
      } else {
        setError(data.message || "거래처 생성에 실패했습니다.");
      }
    } catch (error) {
      setError("거래처 생성 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setEditData({
      business_number: vendor.business_number || "",
      name: vendor.name,
      contact_person: vendor.contact_person || "",
      contact_phone: vendor.contact_phone || "",
      tax_email: vendor.tax_email || "",
    });
  };

  const handleUpdate = async (id: number) => {
    setError("");

    if (!editData.name.trim()) {
      setError("거래처명을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_number: editData.business_number || null,
          name: editData.name.trim(),
          contact_person: editData.contact_person || null,
          contact_phone: editData.contact_phone || null,
          tax_email: editData.tax_email || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        setEditData({
          business_number: "",
          name: "",
          contact_person: "",
          contact_phone: "",
          tax_email: "",
        });
        fetchVendors();
        if (onVendorAdded) {
          onVendorAdded();
        }
      } else {
        setError(data.message || "거래처 수정에 실패했습니다.");
      }
    } catch (error) {
      setError("거래처 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchVendors();
        if (onVendorAdded) {
          onVendorAdded();
        }
      } else {
        setError(data.message || "거래처 삭제에 실패했습니다.");
      }
    } catch (error) {
      setError("거래처 삭제 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">거래처 관리</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {showAddForm ? "취소" : "+ 거래처 추가"}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거래처명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자번호
                  </label>
                  <input
                    type="text"
                    value={formData.business_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        business_number: e.target.value,
                      })
                    }
                    placeholder="000-00-00000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_person: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자 연락처
                  </label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_phone: e.target.value,
                      })
                    }
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    세금계산서 이메일 주소
                  </label>
                  <input
                    type="email"
                    value={formData.tax_email}
                    onChange={(e) =>
                      setFormData({ ...formData, tax_email: e.target.value })
                    }
                    placeholder="example@email.com"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      거래처명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      사업자번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      담당자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      이메일
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        거래처가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    vendors.map((vendor) => (
                      <tr key={vendor.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === vendor.id ? (
                            <input
                              type="text"
                              value={editData.name}
                              onChange={(e) =>
                                setEditData({ ...editData, name: e.target.value })
                              }
                              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                              autoFocus
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900">
                              {vendor.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === vendor.id ? (
                            <input
                              type="text"
                              value={editData.business_number}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  business_number: e.target.value,
                                })
                              }
                              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                            />
                          ) : (
                            vendor.business_number || "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === vendor.id ? (
                            <input
                              type="text"
                              value={editData.contact_person}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  contact_person: e.target.value,
                                })
                              }
                              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                            />
                          ) : (
                            vendor.contact_person || "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === vendor.id ? (
                            <input
                              type="text"
                              value={editData.contact_phone}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  contact_phone: e.target.value,
                                })
                              }
                              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                            />
                          ) : (
                            vendor.contact_phone || "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === vendor.id ? (
                            <input
                              type="email"
                              value={editData.tax_email}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  tax_email: e.target.value,
                                })
                              }
                              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                            />
                          ) : (
                            vendor.tax_email || "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingId === vendor.id ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleUpdate(vendor.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditData({
                                    business_number: "",
                                    name: "",
                                    contact_person: "",
                                    contact_phone: "",
                                    tax_email: "",
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
                                onClick={() => handleEdit(vendor)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDelete(vendor.id)}
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
      </div>
    </div>
  );
}


"use client";

import { useEffect, useState, useRef, Fragment } from "react";

interface Bank {
  code: string;
  name: string;
}

interface Vendor {
  id: number;
  workspace_id: number;
  business_number: string | null;
  name: string;
  contact_person: string | null;
  contact_phone: string | null;
  tax_email: string | null;
  bank_code: string | null;
  bank_account: string | null;
  business_certificate_file_url: string | null;
  business_certificate_file_name: string | null;
  business_certificate_file_size: number | null;
  business_certificate_mime_type: string | null;
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
  const [banks, setBanks] = useState<Bank[]>([]);
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
    bank_code: "",
    bank_account: "",
  });

  const [editData, setEditData] = useState({
    business_number: "",
    name: "",
    contact_person: "",
    contact_phone: "",
    tax_email: "",
    bank_code: "",
    bank_account: "",
  });

  const [pendingCertificateFile, setPendingCertificateFile] = useState<{
    base64: string;
    file: File;
  } | null>(null);

  const [pendingEditCertificateFile, setPendingEditCertificateFile] = useState<{
    base64: string;
    file: File;
  } | null>(null);

  const certificateFileInputRef = useRef<HTMLInputElement>(null);
  const editCertificateFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      fetchBanks();
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

  const fetchBanks = async () => {
    try {
      const response = await fetch("/api/banks");
      const data = await response.json();
      if (data.success) {
        setBanks(data.data);
      }
    } catch (error) {
      console.error("은행 코드 조회 오류:", error);
    }
  };

  const handleCertificatePaste = async (
    e: React.ClipboardEvent<HTMLElement>
  ) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleCertificateImageFile(file, false);
        }
      }
    }
  };

  const handleEditCertificatePaste = async (
    e: React.ClipboardEvent<HTMLElement>
  ) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleCertificateImageFile(file, true);
        }
      }
    }
  };

  const handleCertificateImageFile = async (file: File, isEdit: boolean) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          if (isEdit) {
            setPendingEditCertificateFile({ base64, file });
          } else {
            setPendingCertificateFile({ base64, file });
          }
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

  const handleCertificateFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleCertificateImageFile(file, isEdit);
    }
  };

  const handleRemoveCertificateFile = (isEdit: boolean) => {
    if (isEdit) {
      setPendingEditCertificateFile(null);
      if (editCertificateFileInputRef.current) {
        editCertificateFileInputRef.current.value = "";
      }
    } else {
      setPendingCertificateFile(null);
      if (certificateFileInputRef.current) {
        certificateFileInputRef.current.value = "";
      }
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
          bank_code: formData.bank_code || null,
          bank_account: formData.bank_account || null,
          business_certificate_file_url: pendingCertificateFile?.base64 || null,
          business_certificate_file_name:
            pendingCertificateFile?.file.name || null,
          business_certificate_file_size:
            pendingCertificateFile?.file.size || null,
          business_certificate_mime_type:
            pendingCertificateFile?.file.type || null,
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
          bank_code: "",
          bank_account: "",
        });
        setPendingCertificateFile(null);
        if (certificateFileInputRef.current) {
          certificateFileInputRef.current.value = "";
        }
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
      bank_code: vendor.bank_code || "",
      bank_account: vendor.bank_account || "",
    });
    setPendingEditCertificateFile(null);
  };

  const handleUpdate = async (id: number) => {
    setError("");

    if (!editData.name.trim()) {
      setError("거래처명을 입력해주세요.");
      return;
    }

    try {
      const updateData: any = {
        business_number: editData.business_number || null,
        name: editData.name.trim(),
        contact_person: editData.contact_person || null,
        contact_phone: editData.contact_phone || null,
        tax_email: editData.tax_email || null,
        bank_code: editData.bank_code || null,
        bank_account: editData.bank_account || null,
      };

      // 새로운 파일이 있으면 파일 정보 업데이트
      if (pendingEditCertificateFile) {
        updateData.business_certificate_file_url =
          pendingEditCertificateFile.base64;
        updateData.business_certificate_file_name =
          pendingEditCertificateFile.file.name;
        updateData.business_certificate_file_size =
          pendingEditCertificateFile.file.size;
        updateData.business_certificate_mime_type =
          pendingEditCertificateFile.file.type;
      }

      const response = await fetch(`/api/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
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
          bank_code: "",
          bank_account: "",
        });
        setPendingEditCertificateFile(null);
        if (editCertificateFileInputRef.current) {
          editCertificateFileInputRef.current.value = "";
        }
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

  const getBankName = (code: string | null) => {
    if (!code) return "-";
    const bank = banks.find((b) => b.code === code);
    return bank ? bank.name : code;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
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
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (showAddForm) {
                  setFormData({
                    business_number: "",
                    name: "",
                    contact_person: "",
                    contact_phone: "",
                    tax_email: "",
                    bank_code: "",
                    bank_account: "",
                  });
                  setPendingCertificateFile(null);
                  if (certificateFileInputRef.current) {
                    certificateFileInputRef.current.value = "";
                  }
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {showAddForm ? "취소" : "+ 거래처 추가"}
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAdd}
              className="mb-6 p-4 bg-gray-50 rounded-md"
              onPaste={handleCertificatePaste}
            >
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    은행명
                  </label>
                  <select
                    value={formData.bank_code}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">선택하세요</option>
                    {banks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    은행계좌
                  </label>
                  <input
                    type="text"
                    value={formData.bank_account}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_account: e.target.value })
                    }
                    placeholder="계좌번호"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자등록증 파일 첨부 또는 이미지 붙여넣기
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleCertificateFileSelect(e, false)}
                    ref={certificateFileInputRef}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    이미지를 직접 붙여넣거나 파일을 선택하세요.
                  </p>
                </div>

                {pendingCertificateFile && (
                  <div className="md:col-span-2 p-3 border border-gray-300 rounded-md bg-white flex items-center justify-between">
                    <div className="flex items-center">
                      {pendingCertificateFile.file.type.startsWith("image/") ? (
                        <img
                          src={pendingCertificateFile.base64}
                          alt="미리보기"
                          className="w-16 h-16 object-cover rounded-md mr-3"
                        />
                      ) : (
                        <span className="text-indigo-600 mr-3">📄</span>
                      )}
                      <span>{pendingCertificateFile.file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertificateFile(false)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                )}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      은행/계좌
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      사업자등록증
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
                        colSpan={8}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        거래처가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    vendors.map((vendor) => (
                      <Fragment key={vendor.id}>
                        <tr>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === vendor.id ? (
                            <div className="space-y-1">
                              <select
                                value={editData.bank_code}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    bank_code: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                              >
                                <option value="">은행 선택</option>
                                {banks.map((bank) => (
                                  <option key={bank.code} value={bank.code}>
                                    {bank.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={editData.bank_account}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    bank_account: e.target.value,
                                  })
                                }
                                placeholder="계좌번호"
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                              />
                            </div>
                          ) : (
                            <div className="text-xs">
                              {vendor.bank_code
                                ? `${getBankName(vendor.bank_code)}`
                                : "-"}
                              {vendor.bank_account && (
                                <div className="text-gray-600">
                                  {vendor.bank_account}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingId === vendor.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                const fileInput = editCertificateFileInputRef.current;
                                if (fileInput) {
                                  fileInput.click();
                                }
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              파일 변경
                            </button>
                          ) : vendor.business_certificate_file_url ? (
                            <a
                              href={vendor.business_certificate_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 text-sm"
                            >
                              {vendor.business_certificate_file_name || "파일 보기"}
                            </a>
                          ) : (
                            "-"
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
                                    bank_code: "",
                                    bank_account: "",
                                  });
                                  setPendingEditCertificateFile(null);
                                  if (editCertificateFileInputRef.current) {
                                    editCertificateFileInputRef.current.value = "";
                                  }
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
                      {editingId === vendor.id && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdate(vendor.id);
                              }}
                              className="p-4 bg-white border border-gray-200 rounded-md"
                              onPaste={handleEditCertificatePaste}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    사업자등록증 파일 첨부 또는 이미지 붙여넣기
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) =>
                                      handleCertificateFileSelect(e, true)
                                    }
                                    ref={editCertificateFileInputRef}
                                    className="hidden"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const fileInput =
                                          editCertificateFileInputRef.current;
                                        if (fileInput) {
                                          fileInput.click();
                                        }
                                      }}
                                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                    >
                                      파일 선택
                                    </button>
                                    <p className="text-xs text-gray-500 self-center">
                                      또는 이미지를 붙여넣으세요.
                                    </p>
                                  </div>
                                </div>

                                {pendingEditCertificateFile && (
                                  <div className="md:col-span-2 p-3 border border-gray-300 rounded-md bg-white flex items-center justify-between">
                                    <div className="flex items-center">
                                      {pendingEditCertificateFile.file.type.startsWith(
                                        "image/"
                                      ) ? (
                                        <img
                                          src={pendingEditCertificateFile.base64}
                                          alt="미리보기"
                                          className="w-16 h-16 object-cover rounded-md mr-3"
                                        />
                                      ) : (
                                        <span className="text-indigo-600 mr-3">
                                          📄
                                        </span>
                                      )}
                                      <span>
                                        {pendingEditCertificateFile.file.name}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveCertificateFile(true)
                                      }
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                )}

                                {!pendingEditCertificateFile &&
                                  vendor.business_certificate_file_url && (
                                    <div className="md:col-span-2 p-3 border border-gray-300 rounded-md bg-gray-50">
                                      <p className="text-sm text-gray-700 mb-2">
                                        기존 파일:
                                      </p>
                                      <a
                                        href={vendor.business_certificate_file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                                      >
                                        {vendor.business_certificate_file_name ||
                                          "파일 보기"}
                                      </a>
                                      <p className="text-xs text-gray-500 mt-1">
                                        새 파일을 첨부하면 기존 파일이
                                        교체됩니다.
                                      </p>
                                    </div>
                                  )}
                              </div>
                            </form>
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
      </div>
    </div>
  );
}

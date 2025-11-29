"use client";

import { useEffect, useState, useRef } from "react";

interface Vendor {
  id: number;
  name: string;
  business_number: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  tax_email: string | null;
}

interface VendorAutocompleteProps {
  workspaceId: number;
  value: number | null;
  onChange: (vendorId: number | null, vendorName: string) => void;
  onManageClick?: () => void;
  className?: string;
}

export default function VendorAutocomplete({
  workspaceId,
  value,
  onChange,
  onManageClick,
  className = "",
}: VendorAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVendors();
  }, [workspaceId]);

  useEffect(() => {
    if (value && vendors.length > 0) {
      const vendor = vendors.find((v) => v.id === value);
      if (vendor) {
        setSelectedVendor(vendor);
        setSearchTerm(vendor.name);
      }
    } else {
      setSelectedVendor(null);
    }
  }, [value, vendors]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredVendors([]);
      setShowSuggestions(false);
    } else {
      const filtered = vendors.filter(
        (v) =>
          v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (v.business_number &&
            v.business_number.includes(searchTerm))
      );
      setFilteredVendors(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  }, [searchTerm, vendors]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch(`/api/vendors?workspace_id=${workspaceId}`);
      const data = await response.json();
      if (data.success) {
        setVendors(data.data);
      }
    } catch (error) {
      console.error("거래처 조회 오류:", error);
    }
  };

  const handleSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSearchTerm(vendor.name);
    setShowSuggestions(false);
    onChange(vendor.id, vendor.name);
  };

  const handleClear = () => {
    setSelectedVendor(null);
    setSearchTerm("");
    setShowSuggestions(false);
    onChange(null, "");
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedVendor(null);
              onChange(null, "");
            }}
            onFocus={() => {
              if (filteredVendors.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="거래처 검색..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {selectedVendor && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
          {showSuggestions && filteredVendors.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredVendors.map((vendor) => (
                <button
                  key={vendor.id}
                  type="button"
                  onClick={() => handleSelect(vendor)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{vendor.name}</div>
                  {vendor.business_number && (
                    <div className="text-xs text-gray-500">
                      사업자번호: {vendor.business_number}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {onManageClick && (
          <button
            type="button"
            onClick={onManageClick}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 whitespace-nowrap"
          >
            거래처 관리
          </button>
        )}
      </div>
      {selectedVendor && (
        <div className="mt-1 text-xs text-gray-500">
          {selectedVendor.contact_person && (
            <span>담당자: {selectedVendor.contact_person}</span>
          )}
          {selectedVendor.contact_phone && (
            <span className="ml-2">연락처: {selectedVendor.contact_phone}</span>
          )}
        </div>
      )}
    </div>
  );
}


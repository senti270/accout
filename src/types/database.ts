/**
 * 데이터베이스 타입 정의
 */

// ============================================
// Workspace 관련 타입
// ============================================

export interface Workspace {
  id: number;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateWorkspaceInput {
  name: string;
}

export interface UpdateWorkspaceInput {
  name: string;
}

// ============================================
// App Settings 관련 타입
// ============================================

export interface AppSettings {
  id: number;
  access_password: string; // 해시된 비밀번호
  created_at: Date | string;
  updated_at: Date | string;
}

export interface UpdatePasswordInput {
  current_password: string;
  new_password: string;
}

export interface VerifyPasswordInput {
  password: string;
}

// ============================================
// Project 관련 타입
// ============================================

export interface Project {
  id: string; // 프로젝트 아이디 (PK)
  workspace_id: number;
  name: string;
  start_date: Date | string | null;
  end_date: Date | string | null;
  memo: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateProjectInput {
  id: string; // 프로젝트 아이디
  workspace_id: number;
  name: string;
  start_date?: Date | string | null;
  end_date?: Date | string | null;
  memo?: string | null;
}

export interface UpdateProjectInput {
  name?: string;
  start_date?: Date | string | null;
  end_date?: Date | string | null;
  memo?: string | null;
}

// ============================================
// Transaction 관련 타입
// ============================================

export interface Transaction {
  id: number;
  workspace_id: number;
  project_id: string;
  category: string;
  deposit_amount: number;
  withdrawal_amount: number;
  transaction_date: Date | string;
  memo: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateTransactionInput {
  workspace_id: number;
  project_id: string;
  category: string;
  deposit_amount?: number;
  withdrawal_amount?: number;
  transaction_date: Date | string;
  memo?: string | null;
}

export interface UpdateTransactionInput {
  project_id?: string;
  category?: string;
  deposit_amount?: number;
  withdrawal_amount?: number;
  transaction_date?: Date | string;
  memo?: string | null;
}

// ============================================
// Transaction Receipt 관련 타입
// ============================================

export interface TransactionReceipt {
  id: number;
  transaction_id: number;
  image_url: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: Date | string;
}

export interface CreateTransactionReceiptInput {
  transaction_id: number;
  image_url: string;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
}

// ============================================
// Document 관련 타입
// ============================================

export interface Document {
  id: number;
  workspace_id: number;
  document_type: string; // 예: '사업자등록증', '임대차계약서' 등
  title: string;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  expiry_date: Date | string | null;
  memo: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateDocumentInput {
  workspace_id: number;
  document_type: string;
  title: string;
  file_url: string;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  expiry_date?: Date | string | null;
  memo?: string | null;
}

export interface UpdateDocumentInput {
  document_type?: string;
  title?: string;
  file_url?: string;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  expiry_date?: Date | string | null;
  memo?: string | null;
}

// ============================================
// 통합/확장 타입
// ============================================

// 거래 내역과 증빙서류를 포함한 타입
export interface TransactionWithReceipts extends Transaction {
  receipts: TransactionReceipt[];
}

// 프로젝트와 거래 내역을 포함한 타입
export interface ProjectWithTransactions extends Project {
  transactions: Transaction[];
}

// 워크스페이스와 관련 데이터를 포함한 타입
export interface WorkspaceWithData extends Workspace {
  projects: Project[];
  document_count?: number;
  transaction_count?: number;
}

// ============================================
// 유틸리티 타입
// ============================================

export type DocumentType =
  | "사업자등록증"
  | "임대차계약서"
  | "통장사본"
  | "인감증명서"
  | "기타";

// 거래 정렬 옵션
export interface TransactionSortOptions {
  sort_by?: "transaction_date" | "created_at" | "amount";
  order?: "asc" | "desc";
}

// 거래 필터 옵션
export interface TransactionFilterOptions {
  workspace_id?: number;
  project_id?: string;
  category?: string;
  start_date?: Date | string;
  end_date?: Date | string;
}


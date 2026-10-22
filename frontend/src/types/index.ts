export type UserRole = 'COLLEGE_USER' | 'AICTE_OFFICER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  institution_id?: number | null;
  institution_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  name: string;
  email: string;
  institution_id?: number | null;
  institution_name?: string | null;
}

export interface Institution {
  id: number;
  name: string;
  aicte_code: string;
  institution_type: string;
  address: string;
  state: string;
  contact_person: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  fdr_count?: number;
  total_fdr_amount?: number;
}

export interface Document {
  id: number;
  fdr_id: number;
  storage_provider: string;
  storage_key?: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
  download_url?: string | null;
}

export interface Verification {
  id: number;
  fdr_id: number;
  reviewer_id?: number;
  reviewer_name?: string;
  verification_method: string;
  outcome: 'VERIFIED' | 'CLARIFICATION_REQUIRED' | 'DISCREPANCY_DETECTED' | 'REJECTED';
  observations: string;
  supporting_reference?: string | null;
  created_at: string;
}

export interface FDRRecord {
  id: number;
  institution_id: number;
  institution_name?: string | null;
  aicte_code?: string | null;
  fdr_number: string;
  bank_name: string;
  branch_name: string;
  amount: number;
  currency: string;
  issue_date: string;
  maturity_date: string;
  deposit_type: string;
  administrative_status: string;
  maturity_status: 'ACTIVE' | 'APPROACHING_MATURITY' | 'MATURED';
  verification_status: string;
  scrutiny_remarks?: string | null;
  original_fdr_id?: number | null;
  days_to_maturity?: number;
  documents: Document[];
  verifications: Verification[];
  created_at: string;
  updated_at: string;
}

export interface RenewalRecord {
  id: number;
  original_fdr_id: number;
  original_fdr_number?: string | null;
  replacement_fdr_id: number;
  replacement_fdr_number?: string | null;
  submission_date: string;
  status: string;
  remarks?: string | null;
  created_at: string;
}

export interface ReleaseRequest {
  id: number;
  fdr_id: number;
  fdr_number?: string | null;
  institution_id: number;
  institution_name?: string | null;
  amount?: number | null;
  requester_id?: number | null;
  requester_name?: string | null;
  reason: string;
  status: string;
  reviewer_id?: number | null;
  reviewer_name?: string | null;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: number;
  recipient_id: number;
  fdr_id?: number | null;
  fdr_number?: string | null;
  notification_type: string;
  subject: string;
  message: string;
  due_date?: string | null;
  is_read: boolean;
  delivery_provider: string;
  delivery_status: string;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  actor_id?: number | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  result: string;
  metadata_json?: any;
  ip_address?: string | null;
  created_at: string;
}

export interface CollegeDashboardStats {
  total_fdrs: number;
  active_fdrs: number;
  approaching_maturity: number;
  matured: number;
  under_verification: number;
  clarification_required: number;
  renewals_in_progress: number;
  pending_release_requests: number;
  total_deposit_amount: number;
}

export interface OfficerDashboardStats {
  total_institutions: number;
  total_fdrs: number;
  pending_scrutiny: number;
  upcoming_maturities: number;
  matured_unresolved: number;
  discrepancy_cases: number;
  renewals_awaiting_review: number;
  pending_release_requests: number;
  total_portfolio_amount: number;
}

export interface AdminDashboardStats {
  total_institutions: number;
  total_users: number;
  total_fdrs: number;
  total_amount: number;
  system_health: string;
  last_maturity_job?: any;
  recent_audit_count: number;
  status_distribution: Record<string, number>;
  bank_distribution: Record<string, number>;
}

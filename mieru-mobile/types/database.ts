export type UserRole = "admin" | "user";

export type TenantStatus = "active" | "inactive" | "trial";

export interface UserProfile {
  id: string;
  tenant_id: string;
  role: UserRole;
  name: string;
  staff_id: string | null;
  hospital_code: string;
}

export interface TenantCategory {
  id: string;
  tenant_id: string;
  master_category_id: string;
  master_name: string;
  master_sort_order: number;
  name: string;
  color: string;
  is_active: boolean;
}

export interface TimeLog {
  id: string;
  user_id: string;
  tenant_id: string;
  category_id: string | null;
  category_name?: string;
  category_color?: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  synced: boolean;
  sync_error?: string | null;
}

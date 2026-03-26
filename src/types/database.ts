export type UserRole = "admin" | "user";

export type TenantStatus = "active" | "inactive" | "trial";

export interface Tenant {
  id: string;
  name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: TenantStatus;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  role: UserRole;
  name: string;
  created_at: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  is_standard: boolean;
  tenant_id: string | null;
  created_at: string;
}

export interface TimeLog {
  id: string;
  user_id: string;
  tenant_id: string;
  category_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  created_at: string;
}

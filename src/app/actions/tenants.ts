"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// ─── 型定義 ─────────────────────────────────────────────
export interface TenantRow {
  id: string;
  name: string;
  hospitalCode: string;
  status: string;
  adminUserId: string;
  adminName: string;
  adminEmail: string;
  createdAt: string;
}

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

// ─── 発行済みテナント一覧取得 ───────────────────────────
// service_role を使用して RLS をバイパスし、
// tenants + users (role: admin) を結合して取得する。
export async function getTenantList(): Promise<TenantRow[]> {
  const adminClient = createAdminClient();

  // 1. 全テナントを取得
  const { data: tenants, error: tenantError } = await adminClient
    .from("tenants")
    .select("id, name, hospital_code, status, created_at")
    .order("created_at", { ascending: false });

  if (tenantError || !tenants) {
    console.error("テナント一覧取得エラー:", tenantError?.message);
    return [];
  }

  // 2. 各テナントの管理者（role: admin）を取得
  const tenantIds = tenants.map((t) => t.id);
  const { data: admins, error: adminError } = await adminClient
    .from("users")
    .select("tenant_id, name")
    .in("tenant_id", tenantIds)
    .eq("role", "admin");

  if (adminError) {
    console.error("管理者取得エラー:", adminError.message);
  }

  // 3. 管理者のメールアドレス＋ userId を Auth から取得
  const adminMap = new Map<
    string,
    { userId: string; name: string; email: string }
  >();
  if (admins) {
    for (const admin of admins) {
      const { data: userRows } = await adminClient
        .from("users")
        .select("id")
        .eq("tenant_id", admin.tenant_id)
        .eq("role", "admin")
        .limit(1);

      if (userRows && userRows.length > 0) {
        const userId = userRows[0].id;
        const { data: authUser } = await adminClient.auth.admin.getUserById(
          userId
        );
        adminMap.set(admin.tenant_id, {
          userId,
          name: admin.name,
          email: authUser?.user?.email ?? "---",
        });
      }
    }
  }

  // 4. マージして返す
  return tenants.map((t) => {
    const admin = adminMap.get(t.id);
    return {
      id: t.id,
      name: t.name,
      hospitalCode: t.hospital_code,
      status: t.status,
      adminUserId: admin?.userId ?? "",
      adminName: admin?.name ?? "---",
      adminEmail: admin?.email ?? "---",
      createdAt: t.created_at,
    };
  });
}

// ─── 管理者パスワード強制リセット ───────────────────────
export async function resetAdminPassword(
  userId: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  if (!userId) {
    return { success: false, error: "ユーザーIDが指定されていません" };
  }
  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error: "パスワードは6文字以上で入力してください",
    };
  }

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error("パスワードリセットエラー:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "不明なエラー";
    console.error("パスワードリセット例外:", msg);
    return { success: false, error: msg };
  }
}

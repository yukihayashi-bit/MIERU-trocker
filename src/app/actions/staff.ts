"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { composeDummyEmail } from "@/lib/dummy-email";

// ─── 型定義 ─────────────────────────────────────────────
export interface StaffRow {
  id: string;
  name: string;
  staffId: string;
  role: string;
  createdAt: string;
}

export type AddStaffResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

// ─── ヘルパー ───────────────────────────────────────────
async function getMyProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return { userId: user.id, tenantId: profile.tenant_id, role: profile.role };
}

// ─── テナントの hospital_code を取得 ────────────────────
async function getHospitalCode(tenantId: string): Promise<string | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("tenants")
    .select("hospital_code")
    .eq("id", tenantId)
    .single();
  return data?.hospital_code ?? null;
}

// ─── スタッフ一覧取得 ───────────────────────────────────
export async function getStaffList(): Promise<StaffRow[]> {
  const supabase = await createClient();
  const profile = await getMyProfile();
  if (!profile) return [];

  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, staff_id, role, created_at")
    .eq("tenant_id", profile.tenantId)
    .order("created_at", { ascending: true });

  if (error || !users) {
    console.error("スタッフ一覧取得エラー:", error?.message);
    return [];
  }

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    staffId: u.staff_id ?? "—",
    role: u.role,
    createdAt: u.created_at,
  }));
}

// ─── スタッフ追加 ───────────────────────────────────────
export async function addStaff(
  _prevState: AddStaffResult | null,
  formData: FormData
): Promise<AddStaffResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    const staffId = (formData.get("staffId") as string)?.trim();
    const role = (formData.get("role") as string) || "user";
    const password = formData.get("password") as string;

    // --- バリデーション ---
    const fieldErrors: Record<string, string> = {};
    if (!name) fieldErrors.name = "氏名を入力してください";
    if (!staffId) {
      fieldErrors.staffId = "スタッフIDを入力してください";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(staffId)) {
      fieldErrors.staffId = "半角英数字・ハイフン・アンダースコアのみ使用できます";
    }
    if (!password || password.length < 6) {
      fieldErrors.password = "パスワードは6文字以上で入力してください";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, error: "入力内容を確認してください", fieldErrors };
    }

    // --- 権限チェック ---
    const profile = await getMyProfile();
    if (!profile) {
      return { success: false, error: "認証エラー: ログインし直してください" };
    }
    if (profile.role !== "admin") {
      return { success: false, error: "管理者のみがスタッフを追加できます" };
    }

    // --- hospital_code 取得 ---
    const hospitalCode = await getHospitalCode(profile.tenantId);
    if (!hospitalCode) {
      return { success: false, error: "病院コードの取得に失敗しました" };
    }

    // --- 同一テナント内の staffId 重複チェック ---
    const supabase = await createClient();
    const { data: existingStaff } = await supabase
      .from("users")
      .select("id")
      .eq("tenant_id", profile.tenantId)
      .eq("staff_id", staffId)
      .maybeSingle();

    if (existingStaff) {
      return {
        success: false,
        error: "入力内容を確認してください",
        fieldErrors: { staffId: "このスタッフIDは既に使用されています" },
      };
    }

    // --- ダミーメール合成 ---
    const dummyEmail = composeDummyEmail(staffId, hospitalCode);

    // --- Supabase Auth にユーザー作成（service_role） ---
    const adminClient = createAdminClient();

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: dummyEmail,
        password,
        email_confirm: true,
        user_metadata: { display_name: name },
      });

    if (authError) {
      console.error("Auth ユーザー作成エラー:", authError.message);
      if (authError.message.includes("already been registered")) {
        return { success: false, error: "このスタッフIDは既に登録されています" };
      }
      return { success: false, error: `ユーザー作成に失敗: ${authError.message}` };
    }

    const newUserId = authData.user?.id;
    if (!newUserId) {
      return { success: false, error: "ユーザーIDの取得に失敗しました" };
    }

    // --- public.users テーブルに INSERT ---
    const { error: insertError } = await adminClient.from("users").insert({
      id: newUserId,
      tenant_id: profile.tenantId,
      role: role === "admin" ? "admin" : "user",
      name,
      staff_id: staffId,
    });

    if (insertError) {
      console.error("users INSERT エラー:", insertError.message);
      await adminClient.auth.admin.deleteUser(newUserId);
      return { success: false, error: `ユーザー情報の保存に失敗: ${insertError.message}` };
    }

    revalidatePath("/dashboard/settings/staff");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "不明なエラー";
    console.error("スタッフ追加 - 予期しないエラー:", msg);
    return { success: false, error: msg };
  }
}

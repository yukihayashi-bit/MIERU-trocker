"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── 型定義 ─────────────────────────────────────────────
export interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export type AddMemberResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

// ─── ヘルパー: 現在のユーザー＋テナント情報 ──────────────
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

// ─── メンバー一覧取得 ───────────────────────────────────
export async function getMembers(): Promise<MemberRow[]> {
  const supabase = await createClient();
  const profile = await getMyProfile();
  if (!profile) return [];

  // adminClient で Auth ユーザー情報（email）も取得するため利用
  const adminClient = createAdminClient();

  // 同一テナントのユーザーを取得
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, role, created_at")
    .eq("tenant_id", profile.tenantId)
    .order("created_at", { ascending: true });

  if (error || !users) {
    console.error("メンバー一覧取得エラー:", error?.message);
    return [];
  }

  // Auth から email を取得
  const members: MemberRow[] = [];
  for (const u of users) {
    const { data: authUser } = await adminClient.auth.admin.getUserById(u.id);
    members.push({
      id: u.id,
      name: u.name,
      email: authUser?.user?.email ?? "—",
      role: u.role,
      createdAt: u.created_at,
    });
  }

  return members;
}

// ─── メンバー追加 ───────────────────────────────────────
export async function addMember(
  _prevState: AddMemberResult | null,
  formData: FormData
): Promise<AddMemberResult> {
  try {
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;

    // --- バリデーション ---
    const fieldErrors: Record<string, string> = {};
    if (!name) fieldErrors.name = "氏名を入力してください";
    if (!email) {
      fieldErrors.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = "有効なメールアドレスを入力してください";
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

    // --- Supabase Auth にユーザー作成（service_role） ---
    const adminClient = createAdminClient();

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: name },
      });

    if (authError) {
      console.error("Auth ユーザー作成エラー:", authError.message);
      if (authError.message.includes("already been registered")) {
        return { success: false, error: "このメールアドレスは既に登録されています" };
      }
      return { success: false, error: `ユーザー作成に失敗: ${authError.message}` };
    }

    const newUserId = authData.user?.id;
    if (!newUserId) {
      return { success: false, error: "ユーザーIDの取得に失敗しました" };
    }

    // --- public.users テーブルに INSERT（service_role でRLSバイパス） ---
    const { error: insertError } = await adminClient.from("users").insert({
      id: newUserId,
      tenant_id: profile.tenantId,
      role: "user",
      name,
    });

    if (insertError) {
      console.error("users INSERT エラー:", insertError.message);
      // Auth ユーザーは作成済みなのでロールバック
      await adminClient.auth.admin.deleteUser(newUserId);
      return { success: false, error: `ユーザー情報の保存に失敗: ${insertError.message}` };
    }

    revalidatePath("/dashboard/members");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "不明なエラー";
    console.error("メンバー追加 - 予期しないエラー:", msg);
    return { success: false, error: msg };
  }
}

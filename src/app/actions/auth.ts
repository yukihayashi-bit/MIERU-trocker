"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

// ─── 新規登録 ───────────────────────────────────────────
export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const hospitalName = formData.get("hospitalName") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // --- バリデーション ---
  const fieldErrors: Record<string, string> = {};
  if (!hospitalName || hospitalName.trim().length === 0) {
    fieldErrors.hospitalName = "病院名を入力してください";
  }
  if (!name || name.trim().length === 0) {
    fieldErrors.name = "氏名を入力してください";
  }
  if (!email || email.trim().length === 0) {
    fieldErrors.email = "メールアドレスを入力してください";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "有効なメールアドレスを入力してください";
  }
  if (!password || password.length < 6) {
    fieldErrors.password = "パスワードは6文字以上で入力してください";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // 通常クライアント（Auth 操作用 — セッション Cookie を発行するため）
  const supabase = await createClient();

  // 管理者クライアント（RLS バイパス — テナント・ユーザー初期登録用）
  const adminClient = createAdminClient();

  // 1. Supabase Auth にユーザー作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: name,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return { error: "ユーザーの作成に失敗しました" };
  }

  // 2. tenants テーブルに病院を登録（service_role で RLS バイパス）
  const { data: tenant, error: tenantError } = await adminClient
    .from("tenants")
    .insert({ name: hospitalName.trim(), status: "trial" })
    .select("id")
    .single();

  if (tenantError) {
    // Auth ユーザーは作成済みなので、失敗時はクリーンアップ
    await adminClient.auth.admin.deleteUser(userId);
    return { error: `病院の登録に失敗しました: ${tenantError.message}` };
  }

  // 3. users テーブルに admin として登録（service_role で RLS バイパス）
  const { error: userError } = await adminClient.from("users").insert({
    id: userId,
    tenant_id: tenant.id,
    role: "admin",
    name: name.trim(),
  });

  if (userError) {
    // テナント & Auth ユーザーのクリーンアップ
    await adminClient.from("tenants").delete().eq("id", tenant.id);
    await adminClient.auth.admin.deleteUser(userId);
    return { error: `ユーザー情報の保存に失敗しました: ${userError.message}` };
  }

  redirect("/dashboard");
}

// ─── ログイン ───────────────────────────────────────────
export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // --- バリデーション ---
  const fieldErrors: Record<string, string> = {};
  if (!email || email.trim().length === 0) {
    fieldErrors.email = "メールアドレスを入力してください";
  }
  if (!password || password.length === 0) {
    fieldErrors.password = "パスワードを入力してください";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません" };
  }

  redirect("/dashboard");
}

// ─── ログアウト ──────────────────────────────────────────
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

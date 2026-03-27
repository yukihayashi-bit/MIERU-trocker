"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { composeDummyEmail } from "@/lib/dummy-email";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

// ─── hospital_code 自動生成（英小文字+数字 8桁） ────────
function generateHospitalCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── 新規登録（病院 + 管理者：実メールアドレス） ─────────
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

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. hospital_code を生成（重複チェック付き）
  let hospitalCode = generateHospitalCode();
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await adminClient
      .from("tenants")
      .select("id")
      .eq("hospital_code", hospitalCode)
      .maybeSingle();
    if (!existing) break;
    hospitalCode = generateHospitalCode();
  }

  // 2. 実メールアドレスで Supabase Auth にユーザー作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return { error: "ユーザーの作成に失敗しました" };
  }

  // 3. tenants テーブルに病院を登録
  const { data: tenant, error: tenantError } = await adminClient
    .from("tenants")
    .insert({
      name: hospitalName.trim(),
      status: "trial",
      hospital_code: hospitalCode,
    })
    .select("id, hospital_code")
    .single();

  if (tenantError) {
    await adminClient.auth.admin.deleteUser(userId);
    return { error: `病院の登録に失敗しました: ${tenantError.message}` };
  }

  // 4. users テーブルに admin として登録（staff_id = "admin"）
  const { error: userError } = await adminClient.from("users").insert({
    id: userId,
    tenant_id: tenant.id,
    role: "admin",
    name: name.trim(),
    staff_id: "admin",
  });

  if (userError) {
    await adminClient.from("tenants").delete().eq("id", tenant.id);
    await adminClient.auth.admin.deleteUser(userId);
    return { error: `ユーザー情報の保存に失敗しました: ${userError.message}` };
  }

  redirect("/dashboard");
}

// ─── ログイン（ハイブリッド：メール or 病院コード+スタッフID）
export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const hospitalCode = (formData.get("hospitalCode") as string)?.trim() ?? "";
  const loginId = (formData.get("loginId") as string)?.trim() ?? "";
  const password = formData.get("password") as string;

  // --- バリデーション ---
  const fieldErrors: Record<string, string> = {};
  if (!loginId) {
    fieldErrors.loginId = "メールアドレスまたはスタッフIDを入力してください";
  }
  if (!password) {
    fieldErrors.password = "パスワードを入力してください";
  }

  const isEmail = loginId.includes("@");

  // スタッフIDの場合は病院コード必須
  if (!isEmail && !hospitalCode) {
    fieldErrors.hospitalCode = "スタッフIDでログインする場合は病院コードが必要です";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  // メールアドレスか判定して分岐
  let email: string;
  if (isEmail) {
    // 管理者: 実メールアドレスでそのままログイン
    email = loginId;
  } else {
    // スタッフ: ダミーメールを合成してログイン
    email = composeDummyEmail(loginId, hospitalCode);
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: isEmail
        ? "メールアドレスまたはパスワードが正しくありません"
        : "病院コード、スタッフID、またはパスワードが正しくありません",
    };
  }

  redirect("/dashboard");
}

// ─── ログアウト ──────────────────────────────────────────
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

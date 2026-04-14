import { supabase } from "../lib/supabase";
import { composeDummyEmail } from "../lib/dummy-email";
import type { UserProfile } from "../types/database";

export interface LoginParams {
  hospitalCode: string;
  loginId: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  profile?: UserProfile;
}

/**
 * ハイブリッドログイン:
 * - loginId に @ が含まれる → メールアドレスで直接ログイン
 * - 含まれない → スタッフID + 病院コードからダミーメールを合成
 */
export async function login(params: LoginParams): Promise<LoginResult> {
  const { hospitalCode, loginId, password } = params;
  const isEmail = loginId.includes("@");

  if (!isEmail && !hospitalCode) {
    return {
      success: false,
      error: "スタッフIDでログインする場合は病院コードが必要です",
    };
  }

  const email = isEmail ? loginId : composeDummyEmail(loginId, hospitalCode);

  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return {
      success: false,
      error: isEmail
        ? "メールアドレスまたはパスワードが正しくありません"
        : "病院コード、スタッフID、またはパスワードが正しくありません",
    };
  }

  const profile = await fetchUserProfile();
  if (!profile) {
    return { success: false, error: "ユーザー情報の取得に失敗しました" };
  }

  return { success: true, profile };
}

/** ログアウト */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/** ユーザープロフィールを Supabase から取得 */
export async function fetchUserProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, tenant_id, role, name, staff_id")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  // テナント情報も取得
  const { data: tenant } = await supabase
    .from("tenants")
    .select("hospital_code")
    .eq("id", profile.tenant_id)
    .single();

  return {
    id: profile.id,
    tenant_id: profile.tenant_id,
    role: profile.role,
    name: profile.name,
    staff_id: profile.staff_id,
    hospital_code: tenant?.hospital_code ?? "",
  };
}

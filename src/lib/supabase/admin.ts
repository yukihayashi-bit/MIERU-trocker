import { createClient } from "@supabase/supabase-js";

/**
 * RLS をバイパスする管理者用 Supabase クライアント。
 * サーバーサイド（Server Actions / Route Handlers）でのみ使用すること。
 * 新規テナント登録など、RLS が適用されるとブロックされる操作に限定して利用する。
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY が設定されていません。.env.local を確認してください。"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

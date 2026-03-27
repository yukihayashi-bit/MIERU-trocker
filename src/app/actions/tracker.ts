"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { seedTenantCategories, getActiveTenantCategories } from "./categories";

// ─── Re-export（tracker page から呼べるように） ─────────
export { seedTenantCategories, getActiveTenantCategories };

// ─── 打刻開始 ────────────────────────────────────────────
export type StartResult =
  | { success: true; id: string; startTime: string }
  | { success: false; error: string };

export async function startTracking(): Promise<StartResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const msg = authError?.message ?? "ユーザーが見つかりません";
      console.error("打刻開始 - 認証エラー:", msg);
      return { success: false, error: `認証エラー: ${msg}` };
    }

    // users テーブルから tenant_id を取得
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      const msg = profileError?.message ?? "プロフィールが見つかりません";
      console.error("打刻開始 - プロフィール取得エラー:", msg);
      return { success: false, error: `プロフィール取得エラー: ${msg}` };
    }

    const now = new Date().toISOString();

    // category_id は終了時に設定するため、INSERT から除外
    const { data, error: insertError } = await supabase
      .from("time_logs")
      .insert({
        user_id: user.id,
        tenant_id: profile.tenant_id,
        start_time: now,
      })
      .select("id, start_time")
      .single();

    if (insertError) {
      console.error("打刻開始 - INSERTエラー:", insertError.message, insertError.details, insertError.hint);
      return { success: false, error: `打刻開始に失敗: ${insertError.message}` };
    }

    if (!data) {
      console.error("打刻開始 - データが返されませんでした");
      return { success: false, error: "打刻データの作成に失敗しました" };
    }

    return { success: true, id: data.id, startTime: data.start_time };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "不明なエラー";
    console.error("打刻開始 - 予期しないエラー:", msg);
    return { success: false, error: msg };
  }
}

// ─── 打刻終了＆カテゴリ保存 ──────────────────────────────
export async function stopTracking(
  logId: string,
  categoryId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "認証エラー" };

  // 対象ログを取得
  const { data: log } = await supabase
    .from("time_logs")
    .select("start_time")
    .eq("id", logId)
    .eq("user_id", user.id)
    .single();

  if (!log) return { success: false, error: "打刻データが見つかりません" };

  const now = new Date();
  const startTime = new Date(log.start_time);
  const durationSeconds = Math.round((now.getTime() - startTime.getTime()) / 1000);

  const { error } = await supabase
    .from("time_logs")
    .update({
      end_time: now.toISOString(),
      duration_seconds: durationSeconds,
      category_id: categoryId,
    })
    .eq("id", logId)
    .eq("user_id", user.id);

  if (error) {
    console.error("打刻終了エラー:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/tracker");
  return { success: true };
}

// ─── 今日の履歴取得（レベル2カテゴリ対応） ──────────────
export async function getTodayLogs() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // 今日の JST 00:00:00 を UTC に変換（JST = UTC+9）
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffset);
  const jstMidnight = new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate())
  );
  const todayStartUtc = new Date(jstMidnight.getTime() - jstOffset).toISOString();

  const { data, error } = await supabase
    .from("time_logs")
    .select("id, start_time, end_time, duration_seconds, tenant_categories(name, color)")
    .eq("user_id", user.id)
    .gte("start_time", todayStartUtc)
    .not("end_time", "is", null)
    .order("start_time", { ascending: false });

  if (error) {
    console.error("履歴取得エラー:", error.message);
    return [];
  }

  return data ?? [];
}

// ─── 進行中の打刻を取得 ──────────────────────────────────
export async function getActiveLog(): Promise<{
  id: string;
  startTime: string;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("time_logs")
    .select("id, start_time")
    .eq("user_id", user.id)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? { id: data.id, startTime: data.start_time } : null;
}

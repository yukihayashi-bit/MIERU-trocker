"use server";

import { createClient } from "@/lib/supabase/server";

// ─── 型定義 ─────────────────────────────────────────────
export interface KpiData {
  todayTotalSeconds: number;
  monthTotalSeconds: number;
  topCategory: string | null;
  totalRecordsToday: number;
}

export interface CategoryBreakdown {
  name: string;
  totalSeconds: number;
}

export interface DailyTotal {
  date: string; // "MM/DD"
  totalSeconds: number;
}

export interface RecentLog {
  id: string;
  userName: string;
  categoryName: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
}

// ─── ヘルパー: JST 日付計算 ──────────────────────────────
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getJstTodayStartUtc(): string {
  const now = new Date();
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  const jstMidnight = new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate())
  );
  return new Date(jstMidnight.getTime() - JST_OFFSET_MS).toISOString();
}

function getJstMonthStartUtc(): string {
  const now = new Date();
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  const jstMonthStart = new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), 1)
  );
  return new Date(jstMonthStart.getTime() - JST_OFFSET_MS).toISOString();
}

function toJstDateString(utcIso: string): string {
  const d = new Date(new Date(utcIso).getTime() + JST_OFFSET_MS);
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${m}/${day}`;
}

function toJstTimeString(utcIso: string): string {
  const d = new Date(new Date(utcIso).getTime() + JST_OFFSET_MS);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

// ─── tenant_id 取得 ──────────────────────────────────────
async function getMyTenantId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  return profile?.tenant_id ?? null;
}

// ─── KPI データ取得 ──────────────────────────────────────
export async function getKpiData(): Promise<KpiData> {
  const supabase = await createClient();
  const tenantId = await getMyTenantId();
  if (!tenantId) {
    return { todayTotalSeconds: 0, monthTotalSeconds: 0, topCategory: null, totalRecordsToday: 0 };
  }

  const todayStart = getJstTodayStartUtc();
  const monthStart = getJstMonthStartUtc();

  // 今日の記録
  const { data: todayLogs } = await supabase
    .from("time_logs")
    .select("duration_seconds")
    .eq("tenant_id", tenantId)
    .gte("start_time", todayStart)
    .not("end_time", "is", null);

  const todayTotalSeconds = (todayLogs ?? []).reduce(
    (sum, l) => sum + (l.duration_seconds ?? 0),
    0
  );
  const totalRecordsToday = todayLogs?.length ?? 0;

  // 今月の記録
  const { data: monthLogs } = await supabase
    .from("time_logs")
    .select("duration_seconds")
    .eq("tenant_id", tenantId)
    .gte("start_time", monthStart)
    .not("end_time", "is", null);

  const monthTotalSeconds = (monthLogs ?? []).reduce(
    (sum, l) => sum + (l.duration_seconds ?? 0),
    0
  );

  // 今月のカテゴリ別集計 → トップ（tenant_categories 参照）
  const { data: catLogs } = await supabase
    .from("time_logs")
    .select("duration_seconds, tenant_categories(name)")
    .eq("tenant_id", tenantId)
    .gte("start_time", monthStart)
    .not("end_time", "is", null)
    .not("category_id", "is", null);

  const catMap = new Map<string, number>();
  for (const log of catLogs ?? []) {
    const catName =
      (log.tenant_categories as unknown as { name: string } | null)?.name ?? "不明";
    catMap.set(catName, (catMap.get(catName) ?? 0) + (log.duration_seconds ?? 0));
  }

  let topCategory: string | null = null;
  let topSeconds = 0;
  for (const [name, secs] of catMap) {
    if (secs > topSeconds) {
      topSeconds = secs;
      topCategory = name;
    }
  }

  return { todayTotalSeconds, monthTotalSeconds, topCategory, totalRecordsToday };
}

// ─── カテゴリ別集計（円グラフ用） ───────────────────────
export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const supabase = await createClient();
  const tenantId = await getMyTenantId();
  if (!tenantId) return [];

  const monthStart = getJstMonthStartUtc();

  const { data } = await supabase
    .from("time_logs")
    .select("duration_seconds, tenant_categories(name)")
    .eq("tenant_id", tenantId)
    .gte("start_time", monthStart)
    .not("end_time", "is", null)
    .not("category_id", "is", null);

  const catMap = new Map<string, number>();
  for (const log of data ?? []) {
    const catName =
      (log.tenant_categories as unknown as { name: string } | null)?.name ?? "不明";
    catMap.set(catName, (catMap.get(catName) ?? 0) + (log.duration_seconds ?? 0));
  }

  return Array.from(catMap.entries())
    .map(([name, totalSeconds]) => ({ name, totalSeconds }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
}

// ─── 日別合計（棒グラフ用・過去7日） ────────────────────
export async function getDailyTotals(): Promise<DailyTotal[]> {
  const supabase = await createClient();
  const tenantId = await getMyTenantId();
  if (!tenantId) return [];

  const now = new Date();
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  const sevenDaysAgo = new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate() - 6)
  );
  const startUtc = new Date(sevenDaysAgo.getTime() - JST_OFFSET_MS).toISOString();

  const { data } = await supabase
    .from("time_logs")
    .select("start_time, duration_seconds")
    .eq("tenant_id", tenantId)
    .gte("start_time", startUtc)
    .not("end_time", "is", null);

  const dayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(
      Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate() - i)
    );
    const label = `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
    dayMap.set(label, 0);
  }

  for (const log of data ?? []) {
    const dateLabel = toJstDateString(log.start_time);
    if (dayMap.has(dateLabel)) {
      dayMap.set(dateLabel, (dayMap.get(dateLabel) ?? 0) + (log.duration_seconds ?? 0));
    }
  }

  return Array.from(dayMap.entries()).map(([date, totalSeconds]) => ({
    date,
    totalSeconds,
  }));
}

// ─── 最近の記録（テナント全体・直近20件） ────────────────
export async function getRecentLogs(): Promise<RecentLog[]> {
  const supabase = await createClient();
  const tenantId = await getMyTenantId();
  if (!tenantId) return [];

  const { data, error } = await supabase
    .from("time_logs")
    .select("id, start_time, end_time, duration_seconds, users(name), tenant_categories(name)")
    .eq("tenant_id", tenantId)
    .not("end_time", "is", null)
    .not("category_id", "is", null)
    .order("start_time", { ascending: false })
    .limit(20);

  if (error) {
    console.error("最近の記録取得エラー:", error.message);
    return [];
  }

  return (data ?? []).map((log) => ({
    id: log.id,
    userName:
      (log.users as unknown as { name: string } | null)?.name ?? "不明",
    categoryName:
      (log.tenant_categories as unknown as { name: string } | null)?.name ?? "不明",
    startTime: toJstTimeString(log.start_time),
    endTime: log.end_time ? toJstTimeString(log.end_time) : "-",
    durationSeconds: log.duration_seconds ?? 0,
  }));
}

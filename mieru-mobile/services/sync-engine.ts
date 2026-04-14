import type { SQLiteDatabase } from "expo-sqlite";
import { supabase } from "../lib/supabase";
import {
  getUnsyncedLogs,
  markSynced,
  markSyncError,
  countUnsynced,
} from "../db/time-logs";
import {
  replaceCategories,
  type CachedCategory,
} from "../db/categories";

// ─── 同期結果 ───────────────────────────────────
export interface SyncResult {
  uploaded: number;
  failed: number;
  categoriesRefreshed: boolean;
}

// ─── 打刻データの上り同期（SQLite → Supabase） ──
export async function syncTimeLogsUp(
  db: SQLiteDatabase
): Promise<{ uploaded: number; failed: number }> {
  const unsyncedLogs = await getUnsyncedLogs(db);

  if (unsyncedLogs.length === 0) {
    return { uploaded: 0, failed: 0 };
  }

  let uploaded = 0;
  let failed = 0;

  for (const log of unsyncedLogs) {
    try {
      // Supabase に INSERT（重複時は server_id で確認）
      const { data, error } = await supabase
        .from("time_logs")
        .upsert(
          {
            id: log.server_id ?? log.id, // server_id があればそれを使う
            user_id: log.user_id,
            tenant_id: log.tenant_id,
            category_id: log.category_id,
            start_time: log.start_time,
            end_time: log.end_time,
            duration_seconds: log.duration_seconds,
          },
          { onConflict: "id" }
        )
        .select("id")
        .single();

      if (error) {
        await markSyncError(db, log.id, error.message);
        failed++;
        continue;
      }

      // 同期成功 → ローカルを is_synced = 1 に更新
      const serverId = data?.id ?? log.id;
      await markSynced(db, log.id, serverId);
      uploaded++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      await markSyncError(db, log.id, msg);
      failed++;
    }
  }

  return { uploaded, failed };
}

// ─── カテゴリの下り同期（Supabase → SQLite） ────
export async function syncCategoriesDown(
  db: SQLiteDatabase,
  tenantId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("tenant_categories")
      .select(
        "id, master_category_id, name, color, is_active, master_categories(name, sort_order)"
      )
      .eq("tenant_id", tenantId);

    if (error || !data) {
      console.warn("カテゴリ同期エラー:", error?.message);
      return false;
    }

    const categories: CachedCategory[] = data.map((row) => {
      const master = row.master_categories as unknown as {
        name: string;
        sort_order: number;
      } | null;
      return {
        id: row.id,
        master_category_id: row.master_category_id,
        master_name: master?.name ?? "不明",
        master_sort_order: master?.sort_order ?? 99,
        name: row.name,
        color: row.color,
        is_active: row.is_active ? 1 : 0,
      };
    });

    await replaceCategories(db, categories);
    return true;
  } catch (e) {
    console.warn("カテゴリ同期例外:", e);
    return false;
  }
}

// ─── フル同期（上り＋下り） ─────────────────────
export async function runFullSync(
  db: SQLiteDatabase,
  tenantId: string
): Promise<SyncResult> {
  // 1. 打刻データを上り同期
  const { uploaded, failed } = await syncTimeLogsUp(db);

  // 2. カテゴリを下り同期
  const categoriesRefreshed = await syncCategoriesDown(db, tenantId);

  return { uploaded, failed, categoriesRefreshed };
}

// ─── 未同期件数を返すユーティリティ ─────────────
export async function getPendingCount(
  db: SQLiteDatabase
): Promise<number> {
  return countUnsynced(db);
}

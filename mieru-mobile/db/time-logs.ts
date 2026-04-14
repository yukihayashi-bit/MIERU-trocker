import type { SQLiteDatabase } from "expo-sqlite";
import * as Crypto from "expo-crypto";

// ─── 型定義 ─────────────────────────────────────
export interface LocalTimeLog {
  id: string;
  user_id: string;
  tenant_id: string;
  category_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  created_at: string;
  is_synced: number; // 0 | 1
  server_id: string | null;
  sync_attempts: number;
  sync_error: string | null;
  last_sync_at: string | null;
}

/** ジョイン後の表示用データ */
export interface TimeLogWithCategory extends LocalTimeLog {
  category_name: string | null;
  category_color: string | null;
}

// ─── 打刻開始 ───────────────────────────────────
export async function insertTimeLog(
  db: SQLiteDatabase,
  userId: string,
  tenantId: string
): Promise<{ id: string; startTime: string }> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO time_logs (id, user_id, tenant_id, start_time, created_at, is_synced, sync_attempts)
     VALUES (?, ?, ?, ?, ?, 0, 0)`,
    [id, userId, tenantId, now, now]
  );

  return { id, startTime: now };
}

// ─── 打刻終了（カテゴリ設定 + 所要時間計算） ────
export async function completeTimeLog(
  db: SQLiteDatabase,
  logId: string,
  categoryId: string
): Promise<void> {
  const now = new Date();
  const nowIso = now.toISOString();

  // start_time を取得して duration を計算
  const row = await db.getFirstAsync<{ start_time: string }>(
    "SELECT start_time FROM time_logs WHERE id = ?",
    [logId]
  );
  if (!row) throw new Error("打刻データが見つかりません");

  const startMs = new Date(row.start_time).getTime();
  const durationSeconds = Math.round((now.getTime() - startMs) / 1000);

  await db.runAsync(
    `UPDATE time_logs
     SET end_time = ?, duration_seconds = ?, category_id = ?, is_synced = 0
     WHERE id = ?`,
    [nowIso, durationSeconds, categoryId, logId]
  );
}

// ─── 進行中の打刻を取得 ─────────────────────────
export async function getActiveLog(
  db: SQLiteDatabase,
  userId: string
): Promise<{ id: string; startTime: string } | null> {
  const row = await db.getFirstAsync<{ id: string; start_time: string }>(
    `SELECT id, start_time FROM time_logs
     WHERE user_id = ? AND end_time IS NULL
     ORDER BY start_time DESC LIMIT 1`,
    [userId]
  );
  return row ? { id: row.id, startTime: row.start_time } : null;
}

// ─── 今日のログ取得（JST 基準） ─────────────────
export async function getTodayLogs(
  db: SQLiteDatabase,
  userId: string
): Promise<TimeLogWithCategory[]> {
  // JST 00:00:00 を UTC に変換
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const now = new Date();
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  const jstMidnight = new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate())
  );
  const todayStartUtc = new Date(
    jstMidnight.getTime() - JST_OFFSET_MS
  ).toISOString();

  return db.getAllAsync<TimeLogWithCategory>(
    `SELECT t.*,
            c.name  AS category_name,
            c.color AS category_color
     FROM time_logs t
     LEFT JOIN categories_cache c ON t.category_id = c.id
     WHERE t.user_id = ?
       AND t.start_time >= ?
       AND t.end_time IS NOT NULL
     ORDER BY t.start_time DESC`,
    [userId, todayStartUtc]
  );
}

// ─── 過去N日分のログ取得（履歴画面用） ──────────
export async function getRecentLogs(
  db: SQLiteDatabase,
  userId: string,
  days: number = 7
): Promise<TimeLogWithCategory[]> {
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const now = new Date();
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  const startDate = new Date(
    Date.UTC(
      jstNow.getUTCFullYear(),
      jstNow.getUTCMonth(),
      jstNow.getUTCDate() - days + 1
    )
  );
  const startUtc = new Date(
    startDate.getTime() - JST_OFFSET_MS
  ).toISOString();

  return db.getAllAsync<TimeLogWithCategory>(
    `SELECT t.*,
            c.name  AS category_name,
            c.color AS category_color
     FROM time_logs t
     LEFT JOIN categories_cache c ON t.category_id = c.id
     WHERE t.user_id = ?
       AND t.start_time >= ?
       AND t.end_time IS NOT NULL
     ORDER BY t.start_time DESC`,
    [userId, startUtc]
  );
}

// ─── 未同期レコード取得（同期エンジン用） ────────
export async function getUnsyncedLogs(
  db: SQLiteDatabase
): Promise<LocalTimeLog[]> {
  return db.getAllAsync<LocalTimeLog>(
    `SELECT * FROM time_logs
     WHERE is_synced = 0
       AND end_time IS NOT NULL
     ORDER BY created_at ASC`
  );
}

// ─── 同期成功マーク ─────────────────────────────
export async function markSynced(
  db: SQLiteDatabase,
  localId: string,
  serverId: string
): Promise<void> {
  await db.runAsync(
    `UPDATE time_logs
     SET is_synced = 1, server_id = ?, sync_error = NULL, last_sync_at = ?
     WHERE id = ?`,
    [serverId, new Date().toISOString(), localId]
  );
}

// ─── 同期失敗記録 ───────────────────────────────
export async function markSyncError(
  db: SQLiteDatabase,
  localId: string,
  error: string
): Promise<void> {
  await db.runAsync(
    `UPDATE time_logs
     SET sync_attempts = sync_attempts + 1,
         sync_error = ?,
         last_sync_at = ?
     WHERE id = ?`,
    [error, new Date().toISOString(), localId]
  );
}

// ─── 未同期件数カウント ─────────────────────────
export async function countUnsynced(
  db: SQLiteDatabase
): Promise<number> {
  const row = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM time_logs
     WHERE is_synced = 0 AND end_time IS NOT NULL`
  );
  return row?.cnt ?? 0;
}

// ─── 進行中の打刻を削除（キャンセル用） ─────────
export async function deleteActiveLog(
  db: SQLiteDatabase,
  logId: string
): Promise<void> {
  await db.runAsync(
    "DELETE FROM time_logs WHERE id = ? AND end_time IS NULL",
    [logId]
  );
}

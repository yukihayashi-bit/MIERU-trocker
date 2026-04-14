import type { SQLiteDatabase } from "expo-sqlite";

/**
 * ローカル DB スキーマ定義 & マイグレーション。
 * アプリ起動時に initDatabase() を 1 回呼ぶ。
 */

const CURRENT_VERSION = 1;

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  // WAL モードで書き込み性能を向上
  await db.execAsync("PRAGMA journal_mode = WAL;");

  // バージョン管理
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;"
  );
  const version = result?.user_version ?? 0;

  if (version < 1) {
    await migrateV1(db);
  }

  // 最新バージョンを記録
  await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION};`);
}

// ─── V1: 初期スキーマ ─────────────────────────────
async function migrateV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    -- 打刻記録（メインテーブル）
    CREATE TABLE IF NOT EXISTS time_logs (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL,
      tenant_id       TEXT NOT NULL,
      category_id     TEXT,
      start_time      TEXT NOT NULL,
      end_time        TEXT,
      duration_seconds INTEGER,
      created_at      TEXT NOT NULL,
      is_synced       INTEGER NOT NULL DEFAULT 0,
      server_id       TEXT,
      sync_attempts   INTEGER NOT NULL DEFAULT 0,
      sync_error      TEXT,
      last_sync_at    TEXT
    );

    -- 未同期レコードを高速検索するインデックス
    CREATE INDEX IF NOT EXISTS idx_time_logs_sync
      ON time_logs (is_synced, created_at);

    -- ユーザー + 日付でのフィルタ用
    CREATE INDEX IF NOT EXISTS idx_time_logs_user_date
      ON time_logs (user_id, start_time);

    -- カテゴリキャッシュ（サーバーからダウンロード）
    CREATE TABLE IF NOT EXISTS categories_cache (
      id                  TEXT PRIMARY KEY,
      master_category_id  TEXT NOT NULL,
      master_name         TEXT NOT NULL,
      master_sort_order   INTEGER NOT NULL DEFAULT 0,
      name                TEXT NOT NULL,
      color               TEXT NOT NULL DEFAULT '#6b7280',
      is_active           INTEGER NOT NULL DEFAULT 1,
      updated_at          TEXT NOT NULL
    );

    -- 汎用キーバリューストア（認証情報キャッシュ等）
    CREATE TABLE IF NOT EXISTS kv_store (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

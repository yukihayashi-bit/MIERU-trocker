import type { SQLiteDatabase } from "expo-sqlite";

// ─── 型定義 ─────────────────────────────────────
export interface CachedCategory {
  id: string;
  master_category_id: string;
  master_name: string;
  master_sort_order: number;
  name: string;
  color: string;
  is_active: number; // 0 | 1
}

/** セクション表示用のグルーピング済みデータ */
export interface CategorySection {
  masterName: string;
  masterSortOrder: number;
  categories: {
    id: string;
    name: string;
    color: string;
  }[];
}

// ─── カテゴリキャッシュの全件置換 ────────────────
export async function replaceCategories(
  db: SQLiteDatabase,
  categories: CachedCategory[]
): Promise<void> {
  const now = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync("DELETE FROM categories_cache");
    for (const cat of categories) {
      await tx.runAsync(
        `INSERT INTO categories_cache
           (id, master_category_id, master_name, master_sort_order, name, color, is_active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cat.id,
          cat.master_category_id,
          cat.master_name,
          cat.master_sort_order,
          cat.name,
          cat.color,
          cat.is_active,
          now,
        ]
      );
    }
  });
}

// ─── アクティブなカテゴリをセクション別に取得 ────
export async function getActiveCategorySections(
  db: SQLiteDatabase
): Promise<CategorySection[]> {
  const rows = await db.getAllAsync<CachedCategory>(
    `SELECT * FROM categories_cache
     WHERE is_active = 1
     ORDER BY master_sort_order ASC, name ASC`
  );

  // マスターカテゴリでグルーピング
  const map = new Map<string, CategorySection>();
  for (const row of rows) {
    let section = map.get(row.master_category_id);
    if (!section) {
      section = {
        masterName: row.master_name,
        masterSortOrder: row.master_sort_order,
        categories: [],
      };
      map.set(row.master_category_id, section);
    }
    section.categories.push({
      id: row.id,
      name: row.name,
      color: row.color,
    });
  }

  return Array.from(map.values()).sort(
    (a, b) => a.masterSortOrder - b.masterSortOrder
  );
}

// ─── キャッシュが空かどうか ─────────────────────
export async function isCacheEmpty(db: SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM categories_cache"
  );
  return (row?.cnt ?? 0) === 0;
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── マスターカテゴリ（レベル1）取得 ────────────────────
export async function getMasterCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("master_categories")
    .select("id, name, description, sort_order")
    .order("sort_order");

  if (error) {
    console.error("マスターカテゴリ取得エラー:", error.message);
    return [];
  }
  return data ?? [];
}

// ─── テナントカテゴリ（レベル2）取得 ────────────────────
export async function getTenantCategories() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) return [];

  const { data, error } = await supabase
    .from("tenant_categories")
    .select("id, tenant_id, master_category_id, name, color, is_active, created_at, master_categories(id, name, description, sort_order)")
    .eq("tenant_id", profile.tenant_id)
    .order("name");

  if (error) {
    console.error("テナントカテゴリ取得エラー:", error.message);
    return [];
  }
  return data ?? [];
}

// ─── アクティブなテナントカテゴリのみ取得（打刻画面用） ─
export async function getActiveTenantCategories() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) return [];

  const { data, error } = await supabase
    .from("tenant_categories")
    .select("id, name, color, master_category_id, master_categories(id, name, sort_order)")
    .eq("tenant_id", profile.tenant_id)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("アクティブカテゴリ取得エラー:", error.message);
    return [];
  }
  return data ?? [];
}

// ─── テナントカテゴリ追加 ───────────────────────────────
export async function addTenantCategory(
  name: string,
  masterCategoryId: string,
  color: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "認証エラー" };

    // admin 確認
    const { data: profile } = await supabase
      .from("users")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "管理者のみがカテゴリを追加できます" };
    }

    const { error } = await supabase.from("tenant_categories").insert({
      tenant_id: profile.tenant_id,
      master_category_id: masterCategoryId,
      name: name.trim(),
      color,
      is_active: true,
    });

    if (error) {
      console.error("カテゴリ追加エラー:", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings/categories");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "不明なエラー";
    return { success: false, error: msg };
  }
}

// ─── テナントカテゴリの有効/無効切り替え ────────────────
export async function toggleTenantCategory(
  categoryId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "認証エラー" };

    const { data: profile } = await supabase
      .from("users")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "管理者のみが変更できます" };
    }

    const { error } = await supabase
      .from("tenant_categories")
      .update({ is_active: isActive })
      .eq("id", categoryId)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("カテゴリ切り替えエラー:", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings/categories");
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "不明なエラー";
    return { success: false, error: msg };
  }
}

// ─── テナントカテゴリ初期投入 ───────────────────────────
// テナントに1つもカテゴリがない場合、マスターカテゴリごとに
// デフォルトのテナントカテゴリを自動生成する。
export async function seedTenantCategories() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) return;

  // 既存カテゴリ数の確認
  const { count } = await supabase
    .from("tenant_categories")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", profile.tenant_id);

  if (count && count > 0) return; // 既にある

  // マスターカテゴリを取得
  const { data: masters } = await supabase
    .from("master_categories")
    .select("id, name")
    .order("sort_order");

  if (!masters || masters.length === 0) return;

  // マスターカテゴリごとのデフォルトサブカテゴリ
  const defaults: Record<string, { name: string; color: string }[]> = {
    "直接ケア": [
      { name: "バイタル測定", color: "#ef4444" },
      { name: "清潔ケア", color: "#f97316" },
      { name: "与薬・注射", color: "#ec4899" },
      { name: "食事介助", color: "#f59e0b" },
      { name: "排泄介助", color: "#a855f7" },
      { name: "患者対応・ナースコール", color: "#06b6d4" },
    ],
    "間接ケア": [
      { name: "移動・搬送", color: "#14b8a6" },
      { name: "巡視", color: "#3b82f6" },
    ],
    "記録": [
      { name: "看護記録", color: "#8b5cf6" },
      { name: "指示受け・伝達", color: "#6366f1" },
    ],
    "カンファレンス": [
      { name: "カンファレンス", color: "#10b981" },
      { name: "申し送り", color: "#22c55e" },
    ],
    "その他": [
      { name: "休憩", color: "#78716c" },
      { name: "その他", color: "#9ca3af" },
    ],
  };

  const rows: {
    tenant_id: string;
    master_category_id: string;
    name: string;
    color: string;
    is_active: boolean;
  }[] = [];

  for (const master of masters) {
    const subs = defaults[master.name] ?? [
      { name: master.name, color: "#6b7280" },
    ];
    for (const sub of subs) {
      rows.push({
        tenant_id: profile.tenant_id,
        master_category_id: master.id,
        name: sub.name,
        color: sub.color,
        is_active: true,
      });
    }
  }

  // service_role でバイパスして INSERT
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("tenant_categories").insert(rows);
  if (error) {
    console.error("テナントカテゴリ初期投入エラー:", error.message);
  }
}

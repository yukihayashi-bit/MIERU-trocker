import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMasterCategories, getTenantCategories } from "@/app/actions/categories";
import { AddCategoryDialog } from "./add-category-dialog";
import { CategoryToggle } from "./category-toggle";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // admin 確認
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const [masterCategories, tenantCategories] = await Promise.all([
    getMasterCategories(),
    getTenantCategories(),
  ]);

  // マスターカテゴリごとにグループ化（sort_order でソート）
  type TC = (typeof tenantCategories)[number];
  const grouped = new Map<string, { masterName: string; sortOrder: number; items: TC[] }>();
  for (const cat of tenantCategories) {
    const mcRaw = cat.master_categories;
    const mc = mcRaw
      ? Array.isArray(mcRaw) ? mcRaw[0] : mcRaw
      : null;
    const masterName = (mc as { name: string } | null)?.name ?? "その他";
    const sortOrder = (mc as { sort_order?: number } | null)?.sort_order ?? 999;
    const masterId = cat.master_category_id;
    if (!grouped.has(masterId)) {
      grouped.set(masterId, { masterName, sortOrder, items: [] });
    }
    grouped.get(masterId)!.items.push(cat);
  }

  const sortedGroups = Array.from(grouped.entries()).sort(
    (a, b) => a[1].sortOrder - b[1].sortOrder
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold tracking-tight">カテゴリ管理</h1>
          </div>
          <AddCategoryDialog masterCategories={masterCategories} />
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            マスターカテゴリ（レベル1）に紐づく業務カテゴリ（レベル2）を管理できます。
            無効化したカテゴリは打刻画面に表示されません。
          </p>
        </div>

        {tenantCategories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                カテゴリがまだ登録されていません。「カテゴリを追加」ボタンから追加してください。
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedGroups.map(([masterId, group]) => (
            <Card key={masterId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.masterName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 divide-y">
                {group.items.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-4 w-4 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <p className={`text-sm font-medium ${!cat.is_active ? "text-muted-foreground line-through" : ""}`}>
                          {cat.name}
                        </p>
                      </div>
                    </div>
                    <CategoryToggle
                      categoryId={cat.id}
                      initialActive={cat.is_active}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}

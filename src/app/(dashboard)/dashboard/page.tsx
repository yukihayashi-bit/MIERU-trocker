import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { KpiCards } from "./kpi-cards";
import { CategoryPieChart, DailyBarChart } from "./charts";
import { RecentLogs } from "./recent-logs";
import { Button } from "@/components/ui/button";
import { Clock, Users, Settings, UserCog } from "lucide-react";
import {
  getKpiData,
  getCategoryBreakdown,
  getDailyTotals,
  getRecentLogs,
} from "@/app/actions/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // users テーブルから表示名とテナント情報を取得
  const { data: profile } = await supabase
    .from("users")
    .select("name, role, tenants(name)")
    .eq("id", user.id)
    .single();

  // ダッシュボードデータを並行取得
  const [kpiData, categoryBreakdown, dailyTotals, recentLogs] =
    await Promise.all([
      getKpiData(),
      getCategoryBreakdown(),
      getDailyTotals(),
      getRecentLogs(),
    ]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">MIERU</h1>
            {profile && (
              <p className="text-xs text-muted-foreground">
                {(profile.tenants as unknown as { name: string } | null)?.name ?? ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/tracker">
              <Button size="sm" className="rounded-full">
                <Clock className="mr-1.5 h-4 w-4" />
                打刻
              </Button>
            </Link>
            {profile?.role === "admin" && (
              <>
                <Link href="/dashboard/settings/staff">
                  <Button size="sm" variant="outline" className="rounded-full">
                    <UserCog className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">スタッフ</span>
                  </Button>
                </Link>
                <Link href="/dashboard/settings/categories">
                  <Button size="sm" variant="outline" className="rounded-full">
                    <Settings className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">カテゴリ</span>
                  </Button>
                </Link>
              </>
            )}
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {profile?.name ?? user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 space-y-6">
        {/* ページタイトル */}
        <div>
          <h2 className="text-xl font-bold tracking-tight">ダッシュボード</h2>
          <p className="text-sm text-muted-foreground">
            テナント全体の業務データを確認できます
          </p>
        </div>

        {/* KPIカード */}
        <KpiCards data={kpiData} />

        {/* グラフセクション */}
        <div className="grid gap-4 lg:grid-cols-2">
          <CategoryPieChart data={categoryBreakdown} />
          <DailyBarChart data={dailyTotals} />
        </div>

        {/* 最近の記録 */}
        <RecentLogs logs={recentLogs} />
      </main>
    </div>
  );
}

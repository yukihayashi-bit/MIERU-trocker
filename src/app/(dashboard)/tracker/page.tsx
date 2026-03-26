import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  seedStandardCategories,
  getCategories,
  getTodayLogs,
  getActiveLog,
} from "@/app/actions/tracker";
import { TimerDisplay } from "./timer-display";
import { TodayLogs } from "./today-logs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function TrackerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 標準カテゴリの初期投入（必要な場合のみ）
  await seedStandardCategories();

  // 並列でデータ取得
  const [categories, todayLogs, activeLog] = await Promise.all([
    getCategories(),
    getTodayLogs(),
    getActiveLog(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">タイムトラッカー</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 flex flex-col gap-6">
        {/* タイマー */}
        <TimerDisplay categories={categories} initialActiveLog={activeLog} />

        {/* 今日の履歴 */}
        <TodayLogs logs={todayLogs} />
      </main>
    </div>
  );
}

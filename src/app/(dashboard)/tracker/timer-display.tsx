"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { startTracking, stopTracking } from "@/app/actions/tracker";
import { CategoryDialog } from "./category-dialog";
import { Play, Square, AlertCircle } from "lucide-react";

type Category = { id: string; name: string };

interface TimerDisplayProps {
  categories: Category[];
  initialActiveLog: { id: string; startTime: string } | null;
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function TimerDisplay({
  categories,
  initialActiveLog,
}: TimerDisplayProps) {
  const [activeLog, setActiveLog] = useState(initialActiveLog);
  const [elapsed, setElapsed] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── タイマーの更新 ──
  const tick = useCallback(() => {
    if (!activeLog) return;
    const start = new Date(activeLog.startTime).getTime();
    const now = Date.now();
    setElapsed(Math.floor((now - start) / 1000));
  }, [activeLog]);

  useEffect(() => {
    if (activeLog) {
      tick(); // 即座に計算
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeLog, tick]);

  // ── 開始 ──
  const handleStart = async () => {
    setIsStarting(true);
    setErrorMsg(null);
    const result = await startTracking();
    if (result.success) {
      setActiveLog({ id: result.id, startTime: result.startTime });
    } else {
      setErrorMsg(result.error);
    }
    setIsStarting(false);
  };

  // ── 終了ボタン → Dialog を開く ──
  const handleStopClick = () => {
    setShowDialog(true);
  };

  // ── カテゴリ選択後に保存 ──
  const handleSave = async (categoryId: string) => {
    if (!activeLog) return;
    setErrorMsg(null);
    const result = await stopTracking(activeLog.id, categoryId);
    if (result.success) {
      setActiveLog(null);
      setShowDialog(false);
    } else {
      setErrorMsg(result.error ?? "保存に失敗しました");
    }
  };

  const isRunning = !!activeLog;

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8">
          {/* エラー表示 */}
          {errorMsg && (
            <div className="flex w-full items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* ストップウォッチ表示 */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {isRunning ? "計測中" : "待機中"}
            </p>
            <div
              className={`font-mono text-6xl font-bold tracking-wider tabular-nums ${
                isRunning ? "text-primary" : "text-muted-foreground/40"
              }`}
            >
              {formatElapsed(elapsed)}
            </div>
          </div>

          {/* ステータスインジケーター */}
          {isRunning && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
              <span className="text-sm text-green-600 font-medium">業務中</span>
            </div>
          )}

          {/* 開始 / 終了ボタン */}
          {!isRunning ? (
            <Button
              size="lg"
              className="h-16 w-full max-w-xs text-lg font-bold rounded-2xl"
              onClick={handleStart}
              disabled={isStarting}
            >
              <Play className="mr-2 h-6 w-6" />
              {isStarting ? "開始中..." : "業務開始"}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="destructive"
              className="h-16 w-full max-w-xs text-lg font-bold rounded-2xl"
              onClick={handleStopClick}
            >
              <Square className="mr-2 h-6 w-6" />
              業務終了
            </Button>
          )}
        </CardContent>
      </Card>

      {/* カテゴリ選択ダイアログ */}
      <CategoryDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        categories={categories}
        onSave={handleSave}
      />
    </>
  );
}

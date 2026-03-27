"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Tag } from "lucide-react";

interface LogEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  tenant_categories: { name: string; color: string } | { name: string; color: string }[] | null;
}

interface TodayLogsProps {
  logs: LogEntry[];
}

/** UTC の ISO 文字列を JST の HH:mm に変換（クライアントサイド） */
function toJstTimeString(utcIso: string): string {
  const date = new Date(utcIso);
  return date.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** 秒数を「Xh Ym」または「Xm Ys」に変換 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}時間${m > 0 ? ` ${m}分` : ""}`;
  return `${m}分`;
}

/** 合計秒数を計算 */
function totalSeconds(logs: LogEntry[]): number {
  return logs.reduce((sum, l) => sum + (l.duration_seconds ?? 0), 0);
}

export function TodayLogs({ logs }: TodayLogsProps) {
  const total = totalSeconds(logs);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold">今日の記録</CardTitle>
          <span className="text-sm text-muted-foreground">
            合計: {formatDuration(total)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            まだ記録がありません
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3"
              >
                {(() => {
                  const tc = log.tenant_categories;
                  const color = tc
                    ? Array.isArray(tc) ? tc[0]?.color : tc.color
                    : "#9ca3af";
                  return (
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: color ?? "#9ca3af" }}
                    />
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {log.tenant_categories
                      ? Array.isArray(log.tenant_categories)
                        ? log.tenant_categories[0]?.name ?? "未分類"
                        : log.tenant_categories.name
                      : "未分類"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {toJstTimeString(log.start_time)}
                    {" → "}
                    {log.end_time ? toJstTimeString(log.end_time) : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {log.duration_seconds
                    ? formatDuration(log.duration_seconds)
                    : "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

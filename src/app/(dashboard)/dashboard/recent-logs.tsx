import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Tag, Clock } from "lucide-react";
import type { RecentLog } from "@/app/actions/dashboard";

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}分`;
  return `${h}時間${m > 0 ? `${m}分` : ""}`;
}

interface RecentLogsProps {
  logs: RecentLog[];
}

export function RecentLogs({ logs }: RecentLogsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          最近の記録
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            まだ記録がありません
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2.5"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {log.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate">{log.userName}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>
                      {log.startTime} – {log.endTime}
                    </span>
                  </div>
                </div>
                <div className="ml-3 shrink-0 rounded-md bg-muted px-2.5 py-1 text-sm font-semibold tabular-nums">
                  {formatDuration(log.durationSeconds)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

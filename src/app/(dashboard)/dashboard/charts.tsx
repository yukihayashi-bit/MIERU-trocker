"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryBreakdown, DailyTotal } from "@/app/actions/dashboard";

// ─── 色パレット ──────────────────────────────────────────
const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
];

function formatMinutes(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}分`;
  return `${h}h${m > 0 ? `${m}m` : ""}`;
}

// ─── マウント判定フック ──────────────────────────────────
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

// ─── チャートのプレースホルダー（SSR時に表示） ──────────
function ChartPlaceholder() {
  return (
    <div className="flex h-[280px] items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
    </div>
  );
}

// ─── カテゴリ別 円グラフ ─────────────────────────────────
interface CategoryPieChartProps {
  data: CategoryBreakdown[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const mounted = useMounted();

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            業務カテゴリ別割合（今月）
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            データがありません
          </p>
        </CardContent>
      </Card>
    );
  }

  const pieData = data.map((d) => ({
    name: d.name,
    value: d.totalSeconds,
  }));

  const totalSeconds = data.reduce((s, d) => s + d.totalSeconds, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          業務カテゴリ別割合（今月）
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!mounted ? (
          <ChartPlaceholder />
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={800}
                >
                  {pieData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatMinutes(Number(value))}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "13px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* 凡例 */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          {data.map((d, idx) => {
            const pct = totalSeconds > 0
              ? Math.round((d.totalSeconds / totalSeconds) * 100)
              : 0;
            return (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-muted-foreground">
                  {d.name} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 日別合計 棒グラフ ───────────────────────────────────
interface DailyBarChartProps {
  data: DailyTotal[];
}

export function DailyBarChart({ data }: DailyBarChartProps) {
  const mounted = useMounted();

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            日別労働時間（過去7日）
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            データがありません
          </p>
        </CardContent>
      </Card>
    );
  }

  // 秒 → 時間（小数）に変換して表示
  const barData = data.map((d) => ({
    date: d.date,
    hours: Math.round((d.totalSeconds / 3600) * 10) / 10,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          日別労働時間（過去7日）
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!mounted ? (
          <ChartPlaceholder />
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="20%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `${v}h`}
                  width={40}
                />
                <Tooltip
                  formatter={(value) => [`${value}時間`, "労働時間"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "13px",
                  }}
                />
                <Bar
                  dataKey="hours"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

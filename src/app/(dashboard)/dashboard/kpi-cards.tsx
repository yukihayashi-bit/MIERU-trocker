import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CalendarDays, Trophy, FileText } from "lucide-react";
import type { KpiData } from "@/app/actions/dashboard";

function formatHoursMinutes(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}分`;
  return `${h}時間${m > 0 ? `${m}分` : ""}`;
}

interface KpiCardsProps {
  data: KpiData;
}

export function KpiCards({ data }: KpiCardsProps) {
  const cards = [
    {
      title: "今日の総労働時間",
      value: formatHoursMinutes(data.todayTotalSeconds),
      sub: `${data.totalRecordsToday}件の記録`,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "今月の総労働時間",
      value: formatHoursMinutes(data.monthTotalSeconds),
      sub: "テナント全体",
      icon: CalendarDays,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "最多業務カテゴリ",
      value: data.topCategory ?? "—",
      sub: "今月の最も長い業務",
      icon: Trophy,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "今日の記録件数",
      value: `${data.totalRecordsToday}件`,
      sub: "テナント全体",
      icon: FileText,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-1.5 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tracking-tight lg:text-2xl">
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

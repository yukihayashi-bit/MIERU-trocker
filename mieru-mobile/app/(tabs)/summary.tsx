import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SyncStatusBar } from "../../components/sync/SyncStatusBar";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { COLORS } from "../../constants/config";
import { formatDuration } from "../../lib/date-utils";

// ─── モックデータ ───────────────────────────────
const MOCK_KPI = {
  todaySeconds: 16200,    // 4:30
  todayCount: 8,
  monthSeconds: 245700,   // 68:15
  monthCount: 142,
};

const MOCK_WEEKLY = [
  { day: "月", seconds: 25200 },
  { day: "火", seconds: 28800 },
  { day: "水", seconds: 18000 },
  { day: "木", seconds: 27000 },
  { day: "金", seconds: 30600 },
  { day: "土", seconds: 0 },
  { day: "日", seconds: 16200 },
];

const MOCK_CATEGORIES = [
  { name: "バイタル測定", color: "#ef4444", seconds: 66600, pct: 27 },
  { name: "看護記録", color: "#8b5cf6", seconds: 43200, pct: 18 },
  { name: "清潔ケア", color: "#f97316", seconds: 35100, pct: 14 },
  { name: "与薬・注射", color: "#ec4899", seconds: 28800, pct: 12 },
  { name: "カンファレンス", color: "#10b981", seconds: 21600, pct: 9 },
  { name: "食事介助", color: "#f59e0b", seconds: 18000, pct: 7 },
  { name: "その他", color: "#9ca3af", seconds: 32400, pct: 13 },
];

const MAX_BAR_SECONDS = Math.max(...MOCK_WEEKLY.map((d) => d.seconds), 1);

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiSub}>{sub}</Text>
    </View>
  );
}

export default function SummaryScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <SyncStatusBar />
      <ScreenHeader title="マイサマリー" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <KpiCard
            label="今日"
            value={formatDuration(MOCK_KPI.todaySeconds)}
            sub={`${MOCK_KPI.todayCount}件の記録`}
          />
          <KpiCard
            label="今月"
            value={formatDuration(MOCK_KPI.monthSeconds)}
            sub={`${MOCK_KPI.monthCount}件`}
          />
        </View>

        {/* Weekly Bar Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>過去7日間</Text>
          <View style={styles.barChart}>
            {MOCK_WEEKLY.map((day) => {
              const ratio = day.seconds / MAX_BAR_SECONDS;
              return (
                <View key={day.day} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max(ratio * 100, 2)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day.day}</Text>
                  <Text style={styles.barValue}>
                    {day.seconds > 0
                      ? `${Math.round(day.seconds / 3600)}h`
                      : "-"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カテゴリ別（今月）</Text>
          {MOCK_CATEGORIES.map((cat) => (
            <View key={cat.name} style={styles.catRow}>
              <View style={styles.catInfo}>
                <View
                  style={[styles.catDot, { backgroundColor: cat.color }]}
                />
                <Text style={styles.catName}>{cat.name}</Text>
              </View>
              <View style={styles.catBarTrack}>
                <View
                  style={[
                    styles.catBarFill,
                    {
                      width: `${cat.pct}%`,
                      backgroundColor: cat.color,
                    },
                  ]}
                />
              </View>
              <View style={styles.catValues}>
                <Text style={styles.catTime}>
                  {formatDuration(cat.seconds)}
                </Text>
                <Text style={styles.catPct}>{cat.pct}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Web版への誘導 */}
        <View style={styles.webNote}>
          <Text style={styles.webNoteText}>
            テナント全体のダッシュボードはPC版をご利用ください
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // KPI
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  kpiLabel: {
    fontSize: 13,
    color: COLORS.grayDark,
    fontWeight: "600",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.black,
    fontVariant: ["tabular-nums"],
  },
  kpiSub: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  // Section
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.grayDark,
    marginBottom: 12,
  },
  // Bar Chart
  barChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
  },
  barTrack: {
    width: "100%",
    height: 100,
    backgroundColor: COLORS.grayLight,
    borderRadius: 4,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    color: COLORS.grayDark,
    marginTop: 4,
    fontWeight: "600",
  },
  barValue: {
    fontSize: 10,
    color: COLORS.gray,
  },
  // Category Breakdown
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  catInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: 110,
    gap: 6,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    fontSize: 13,
    color: COLORS.black,
  },
  catBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.grayLight,
    borderRadius: 4,
    overflow: "hidden",
  },
  catBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  catValues: {
    width: 70,
    alignItems: "flex-end",
  },
  catTime: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.black,
    fontVariant: ["tabular-nums"],
  },
  catPct: {
    fontSize: 10,
    color: COLORS.gray,
  },
  // Web Note
  webNote: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  webNoteText: {
    fontSize: 12,
    color: COLORS.grayDark,
  },
});

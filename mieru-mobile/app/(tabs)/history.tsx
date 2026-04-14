import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SyncStatusBar } from "../../components/sync/SyncStatusBar";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useDatabase } from "../../providers/DatabaseProvider";
import { useAuth } from "../../hooks/useAuth";
import { getRecentLogs, type TimeLogWithCategory } from "../../db/time-logs";
import { COLORS } from "../../constants/config";
import { formatDuration, toJstTimeString, toJstDateString } from "../../lib/date-utils";

interface DaySection {
  title: string;
  totalSeconds: number;
  data: TimeLogWithCategory[];
}

function groupByDay(logs: TimeLogWithCategory[]): DaySection[] {
  const map = new Map<string, DaySection>();

  for (const log of logs) {
    const dateKey = toJstDateString(log.start_time);
    let section = map.get(dateKey);
    if (!section) {
      // JST の今日・昨日判定
      const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
      const now = new Date();
      const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
      const todayKey = `${String(jstNow.getUTCMonth() + 1).padStart(2, "0")}/${String(jstNow.getUTCDate()).padStart(2, "0")}`;

      const yesterday = new Date(
        Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate() - 1)
      );
      const yesterdayKey = `${String(yesterday.getUTCMonth() + 1).padStart(2, "0")}/${String(yesterday.getUTCDate()).padStart(2, "0")}`;

      let suffix = "";
      if (dateKey === todayKey) suffix = "（今日）";
      else if (dateKey === yesterdayKey) suffix = "（昨日）";

      section = {
        title: `2026/${dateKey}${suffix}`,
        totalSeconds: 0,
        data: [],
      };
      map.set(dateKey, section);
    }
    section.data.push(log);
    section.totalSeconds += log.duration_seconds ?? 0;
  }

  return Array.from(map.values());
}

function SyncBadge({ synced }: { synced: boolean }) {
  return (
    <Text
      style={[
        styles.syncBadge,
        { color: synced ? COLORS.success : COLORS.warning },
      ]}
    >
      {synced ? "☁ 済" : "⏳ 未"}
    </Text>
  );
}

export default function HistoryScreen() {
  const db = useDatabase();
  const { profile } = useAuth();
  const [sections, setSections] = useState<DaySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = useCallback(async () => {
    if (!profile) return;
    const logs = await getRecentLogs(db, profile.id, 7);
    setSections(groupByDay(logs));
  }, [db, profile]);

  useEffect(() => {
    loadLogs().finally(() => setIsLoading(false));
  }, [loadLogs]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadLogs();
    setIsRefreshing(false);
  }, [loadLogs]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <SyncStatusBar />
        <ScreenHeader title="履歴" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <SyncStatusBar />
      <ScreenHeader title="履歴" />

      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>まだ記録がありません</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionTotal}>
                合計: {formatDuration(section.totalSeconds)}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.logItem}>
              <View style={styles.logTop}>
                <Text style={styles.logTime}>
                  {toJstTimeString(item.start_time)} -{" "}
                  {item.end_time ? toJstTimeString(item.end_time) : "--:--"}
                </Text>
                <Text style={styles.logDuration}>
                  {formatDuration(item.duration_seconds ?? 0)}
                </Text>
              </View>
              <View style={styles.logBottom}>
                <View style={styles.categoryLabel}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: item.category_color ?? COLORS.gray },
                    ]}
                  />
                  <Text style={styles.categoryName}>
                    {item.category_name ?? "未分類"}
                  </Text>
                </View>
                <SyncBadge synced={!!item.is_synced} />
              </View>
            </View>
          )}
          renderSectionFooter={() => <View style={styles.sectionDivider} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  listContent: {
    paddingBottom: 20,
  },
  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.grayLight,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.grayDark,
  },
  sectionTotal: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  sectionDivider: {
    height: 8,
  },
  // Log Item
  logItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  logTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  logTime: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.black,
    fontVariant: ["tabular-nums"],
  },
  logDuration: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.black,
    fontVariant: ["tabular-nums"],
  },
  logBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: 13,
    color: COLORS.grayDark,
  },
  syncBadge: {
    fontSize: 12,
    fontWeight: "600",
  },
});

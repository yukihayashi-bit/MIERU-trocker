import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SyncStatusBar } from "../../components/sync/SyncStatusBar";
import { useTracker } from "../../hooks/useTracker";
import { COLORS } from "../../constants/config";
import { formatStopwatch, formatDuration, toJstTimeString } from "../../lib/date-utils";

export default function TrackerScreen() {
  const {
    isTracking,
    elapsedSeconds,
    startTime,
    todayLogs,
    categorySections,
    isLoading,
    start,
    stop,
  } = useTracker();

  const [showCategorySheet, setShowCategorySheet] = useState(false);

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await start();
  };

  const handleStop = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowCategorySheet(true);
  };

  const handleCategorySelect = async (categoryId: string) => {
    setShowCategorySheet(false);
    await stop(categoryId);
  };

  const handleCancelStop = () => {
    setShowCategorySheet(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <SyncStatusBar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <SyncStatusBar />

      <View style={styles.container}>
        {/* ストップウォッチ */}
        <View style={styles.timerArea}>
          <Text style={styles.timerText}>
            {formatStopwatch(elapsedSeconds)}
          </Text>
          <Text style={styles.timerLabel}>
            {isTracking ? "計測中" : "待機中"}
          </Text>
          {isTracking && startTime && (
            <Text style={styles.startTimeText}>
              開始: {toJstTimeString(startTime)}
            </Text>
          )}
        </View>

        {/* 開始/停止ボタン */}
        <View style={styles.buttonArea}>
          {isTracking ? (
            <TouchableOpacity
              style={[styles.punchButton, styles.stopButton]}
              onPress={handleStop}
              activeOpacity={0.8}
            >
              <Ionicons name="stop" size={36} color={COLORS.white} />
              <Text style={styles.punchButtonText}>停止</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.punchButton, styles.startButton]}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={36} color={COLORS.white} />
              <Text style={styles.punchButtonText}>開始</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 今日のログ */}
        <View style={styles.logsArea}>
          <Text style={styles.logsTitle}>
            今日の記録 ({todayLogs.length}件)
          </Text>
          {todayLogs.length === 0 ? (
            <Text style={styles.emptyText}>まだ記録がありません</Text>
          ) : (
            <FlatList
              data={todayLogs}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.logRow}>
                  <View style={styles.logLeft}>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: item.category_color ?? COLORS.gray },
                      ]}
                    />
                    <Text style={styles.logTime}>
                      {toJstTimeString(item.start_time)}-
                      {item.end_time ? toJstTimeString(item.end_time) : ""}
                    </Text>
                  </View>
                  <Text style={styles.logCategory} numberOfLines={1}>
                    {item.category_name ?? "未分類"}
                  </Text>
                  <View style={styles.logRight}>
                    <Text style={styles.logDuration}>
                      {formatDuration(item.duration_seconds ?? 0)}
                    </Text>
                    <Text
                      style={[
                        styles.syncIcon,
                        {
                          color: item.is_synced
                            ? COLORS.success
                            : COLORS.warning,
                        },
                      ]}
                    >
                      {item.is_synced ? "☁" : "⏳"}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>

      {/* カテゴリ選択ボトムシート */}
      {showCategorySheet && (
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            onPress={handleCancelStop}
            activeOpacity={1}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>業務カテゴリを選択</Text>
            {categorySections.length === 0 ? (
              <View style={styles.sheetEmpty}>
                <Text style={styles.emptyText}>
                  カテゴリがありません。オンライン時にカテゴリを同期してください。
                </Text>
              </View>
            ) : (
              <FlatList
                data={categorySections}
                keyExtractor={(item) => item.masterName}
                renderItem={({ item: section }) => (
                  <View style={styles.sectionGroup}>
                    <Text style={styles.sectionHeader}>
                      {section.masterName}
                    </Text>
                    {section.categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={styles.categoryRow}
                        onPress={() => handleCategorySelect(cat.id)}
                        activeOpacity={0.6}
                      >
                        <View
                          style={[
                            styles.catDot,
                            { backgroundColor: cat.color },
                          ]}
                        />
                        <Text style={styles.catName}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Timer
  timerArea: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
  },
  timerText: {
    fontSize: 56,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
    color: COLORS.black,
    letterSpacing: 2,
  },
  timerLabel: {
    fontSize: 14,
    color: COLORS.grayDark,
    marginTop: 4,
  },
  startTimeText: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 8,
  },
  // Punch Button
  buttonArea: {
    alignItems: "center",
    paddingVertical: 24,
  },
  punchButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  startButton: {
    backgroundColor: COLORS.primary,
  },
  stopButton: {
    backgroundColor: COLORS.danger,
  },
  punchButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  // Today Logs
  logsArea: {
    flex: 1,
    paddingTop: 16,
  },
  logsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.grayDark,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 12,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  logLeft: {
    flexDirection: "row",
    alignItems: "center",
    width: 110,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  logTime: {
    fontSize: 13,
    color: COLORS.grayDark,
    fontVariant: ["tabular-nums"],
  },
  logCategory: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  logRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logDuration: {
    fontSize: 13,
    color: COLORS.grayDark,
    fontVariant: ["tabular-nums"],
  },
  syncIcon: {
    fontSize: 14,
  },
  // Bottom Sheet
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    color: COLORS.black,
  },
  sheetEmpty: {
    padding: 24,
  },
  sectionGroup: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    paddingTop: 8,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  catDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  catName: {
    fontSize: 16,
    color: COLORS.black,
  },
});

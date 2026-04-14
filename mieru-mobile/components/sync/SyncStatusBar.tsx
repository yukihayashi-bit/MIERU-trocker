import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSyncStatus } from "../../hooks/useSyncStatus";
import { COLORS } from "../../constants/config";

export function SyncStatusBar() {
  const { networkStatus, syncState, pendingCount, triggerSync } =
    useSyncStatus();

  const isOnline = networkStatus === "online";
  const isSyncing = syncState === "syncing";
  const hasError = syncState === "error";

  let dotColor: string = isOnline ? COLORS.syncOnline : COLORS.syncOffline;
  let label = isOnline ? "オンライン" : "オフライン";

  if (isSyncing) {
    dotColor = COLORS.syncSyncing;
    label = "同期中...";
  } else if (hasError) {
    dotColor = COLORS.syncError;
    label = "同期エラー";
  }

  const handlePress = () => {
    if (hasError || (isOnline && pendingCount > 0)) {
      triggerSync();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={hasError || pendingCount > 0 ? 0.7 : 1}
    >
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      {pendingCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>未同期: {pendingCount}件</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: COLORS.grayLight,
    height: 28,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    color: COLORS.grayDark,
  },
  badge: {
    backgroundColor: COLORS.warning,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: "600",
  },
});

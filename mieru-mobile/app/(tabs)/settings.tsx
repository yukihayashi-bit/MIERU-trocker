import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SyncStatusBar } from "../../components/sync/SyncStatusBar";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useAuth } from "../../hooks/useAuth";
import { useSyncStatus } from "../../hooks/useSyncStatus";
import { COLORS } from "../../constants/config";

// ─── モックカテゴリ ─────────────────────────────
const MOCK_CATEGORY_GROUPS = [
  { name: "直接ケア", count: 6 },
  { name: "間接ケア", count: 2 },
  { name: "記録", count: 2 },
  { name: "カンファレンス", count: 2 },
  { name: "その他", count: 2 },
];

function SettingsRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.settingsRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { profile, logout } = useAuth();
  const {
    networkStatus,
    pendingCount,
    lastSyncedAt,
    syncState,
    triggerSync,
  } = useSyncStatus();

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const isOnline = networkStatus === "online";
  const isSyncing = syncState === "syncing";

  const handleSync = () => {
    triggerSync();
  };

  const handleLogout = () => {
    if (pendingCount > 0) {
      Alert.alert(
        "未同期データがあります",
        `${pendingCount}件の打刻データが未同期です。ログアウトするとデータが失われる可能性があります。先に同期してください。`,
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "それでもログアウト",
            style: "destructive",
            onPress: () => logout(),
          },
        ]
      );
    } else {
      Alert.alert("ログアウト", "ログアウトしますか？", [
        { text: "キャンセル", style: "cancel" },
        {
          text: "ログアウト",
          style: "destructive",
          onPress: () => logout(),
        },
      ]);
    }
  };

  const lastSyncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "未同期";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <SyncStatusBar />
      <ScreenHeader title="設定" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* アカウント */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <View style={styles.card}>
            <SettingsRow
              label="氏名"
              value={profile?.name ?? "---"}
            />
            <SettingsRow
              label="スタッフID"
              value={profile?.staff_id ?? "---"}
            />
            <SettingsRow
              label="病院コード"
              value={profile?.hospital_code ?? "---"}
            />
            <SettingsRow
              label="ロール"
              value={
                profile?.role === "admin" ? "管理者" : "スタッフ"
              }
            />
          </View>
        </View>

        {/* データ同期 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ同期</Text>
          <View style={styles.card}>
            <SettingsRow
              label="ステータス"
              value={isOnline ? "● オンライン" : "○ オフライン"}
            />
            <SettingsRow
              label="未同期データ"
              value={`${pendingCount}件`}
            />
            <SettingsRow label="最終同期" value={lastSyncLabel} />
          </View>

          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            onPress={handleSync}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Ionicons name="sync-outline" size={18} color={COLORS.white} />
            )}
            <Text style={styles.syncButtonText}>
              {isSyncing ? "同期中..." : "今すぐ同期する"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* カテゴリ一覧 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カテゴリ一覧</Text>
          <View style={styles.card}>
            {MOCK_CATEGORY_GROUPS.map((group) => (
              <TouchableOpacity
                key={group.name}
                style={styles.categoryGroupRow}
                onPress={() =>
                  setExpandedGroup(
                    expandedGroup === group.name ? null : group.name
                  )
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    expandedGroup === group.name
                      ? "chevron-down"
                      : "chevron-forward"
                  }
                  size={16}
                  color={COLORS.grayDark}
                />
                <Text style={styles.categoryGroupName}>
                  {group.name}
                </Text>
                <Text style={styles.categoryGroupCount}>
                  ({group.count})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.noteText}>
            ※カテゴリやスタッフの管理はPC版をご利用ください
          </Text>
        </View>

        {/* その他 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>その他</Text>
          <View style={styles.card}>
            <SettingsRow label="アプリバージョン" value="v1.0.0" />
          </View>
        </View>

        {/* ログアウト */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>ログアウト</Text>
        </TouchableOpacity>
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
    paddingBottom: 60,
  },
  // Section
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  // Settings Row
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  rowLabel: {
    fontSize: 14,
    color: COLORS.grayDark,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
  },
  // Sync Button
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
  },
  // Category
  categoryGroupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  categoryGroupName: {
    fontSize: 14,
    color: COLORS.black,
    flex: 1,
  },
  categoryGroupCount: {
    fontSize: 13,
    color: COLORS.gray,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: "center",
  },
  // Logout
  logoutButton: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: "600",
  },
});

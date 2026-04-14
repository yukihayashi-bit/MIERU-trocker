import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createElement } from "react";
import { AppState, type AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import type { SQLiteDatabase } from "expo-sqlite";
import type { SyncStatus, NetworkStatus, SyncState } from "../types/sync";
import { runFullSync, getPendingCount } from "../services/sync-engine";

interface SyncContextValue extends SyncStatus {
  /** 手動同期 or 打刻完了後のトリガー */
  triggerSync: () => void;
  /** 未同期件数を再カウント（打刻完了後に呼ぶ） */
  refreshPendingCount: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

interface SyncProviderProps {
  db: SQLiteDatabase;
  tenantId: string | null;
  children: ReactNode;
}

export function SyncProvider({ db, tenantId, children }: SyncProviderProps) {
  const [status, setStatus] = useState<SyncStatus>({
    networkStatus: "online",
    syncState: "idle",
    pendingCount: 0,
    lastSyncedAt: null,
    lastError: null,
  });

  const isSyncingRef = useRef(false);
  const tenantIdRef = useRef(tenantId);
  tenantIdRef.current = tenantId;

  // ─── 未同期件数の更新 ─────────────────────────
  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount(db);
    setStatus((prev) => ({ ...prev, pendingCount: count }));
  }, [db]);

  // ─── 同期実行 ─────────────────────────────────
  const doSync = useCallback(async () => {
    if (isSyncingRef.current || !tenantIdRef.current) return;
    isSyncingRef.current = true;
    setStatus((prev) => ({ ...prev, syncState: "syncing" }));

    try {
      const result = await runFullSync(db, tenantIdRef.current);

      const pending = await getPendingCount(db);
      setStatus((prev) => ({
        ...prev,
        syncState: result.failed > 0 ? "error" : "idle",
        pendingCount: pending,
        lastSyncedAt: new Date().toISOString(),
        lastError:
          result.failed > 0
            ? `${result.failed}件の同期に失敗しました`
            : null,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "同期エラー";
      setStatus((prev) => ({
        ...prev,
        syncState: "error",
        lastError: msg,
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, [db]);

  const triggerSync = useCallback(() => {
    doSync();
  }, [doSync]);

  // ─── 起動時に未同期件数を取得 ─────────────────
  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  // ─── ネットワーク監視 ─────────────────────────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;
      const newStatus: NetworkStatus = isOnline ? "online" : "offline";

      setStatus((prev) => {
        // オフライン → オンライン復帰時に自動同期
        if (prev.networkStatus === "offline" && newStatus === "online") {
          setTimeout(() => doSync(), 500);
        }
        return { ...prev, networkStatus: newStatus };
      });
    });

    return () => unsubscribe();
  }, [doSync]);

  // ─── AppState 監視（フォアグラウンド復帰時に同期）
  useEffect(() => {
    let prevState: AppStateStatus = AppState.currentState;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (prevState.match(/inactive|background/) && nextState === "active") {
        // フォアグラウンド復帰 → 未同期チェック & 同期
        refreshPendingCount().then(() => {
          doSync();
        });
      }
      prevState = nextState;
    });

    return () => subscription.remove();
  }, [doSync, refreshPendingCount]);

  // ─── テナントID が確定したら初回同期（カテゴリダウンロード含む）
  useEffect(() => {
    if (tenantId) {
      doSync();
    }
  }, [tenantId, doSync]);

  return createElement(
    SyncContext.Provider,
    { value: { ...status, triggerSync, refreshPendingCount } },
    children
  );
}

export function useSyncStatus(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSyncStatus must be used within SyncProvider");
  return ctx;
}

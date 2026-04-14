import { useState, useEffect, useRef, useCallback } from "react";
import { useDatabase } from "../providers/DatabaseProvider";
import { useAuth } from "./useAuth";
import { useSyncStatus } from "./useSyncStatus";
import {
  insertTimeLog,
  completeTimeLog,
  getActiveLog,
  getTodayLogs,
  type TimeLogWithCategory,
} from "../db/time-logs";
import {
  getActiveCategorySections,
  type CategorySection,
} from "../db/categories";

export interface TrackerState {
  /** 計測中かどうか */
  isTracking: boolean;
  /** 経過秒数 */
  elapsedSeconds: number;
  /** 計測中ログの開始時刻 (ISO) */
  startTime: string | null;
  /** 計測中ログの ID */
  activeLogId: string | null;
  /** 今日の完了済みログ */
  todayLogs: TimeLogWithCategory[];
  /** カテゴリ選択肢（セクション別） */
  categorySections: CategorySection[];
  /** 読み込み中 */
  isLoading: boolean;
}

export interface TrackerActions {
  /** 打刻開始 */
  start: () => Promise<void>;
  /** 打刻終了（カテゴリ選択後に呼ぶ） */
  stop: (categoryId: string) => Promise<void>;
  /** データ再取得 */
  refresh: () => Promise<void>;
}

export function useTracker(): TrackerState & TrackerActions {
  const db = useDatabase();
  const { profile } = useAuth();
  const { triggerSync, refreshPendingCount } = useSyncStatus();

  const [isTracking, setIsTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [todayLogs, setTodayLogs] = useState<TimeLogWithCategory[]>([]);
  const [categorySections, setCategorySections] = useState<CategorySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── ストップウォッチ ─────────────────────────
  useEffect(() => {
    if (isTracking && startTime) {
      // 即座に経過時間を計算（ページ復帰対応）
      const startMs = new Date(startTime).getTime();
      setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));

      intervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (!isTracking) {
        setElapsedSeconds(0);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTracking, startTime]);

  // ─── 初期ロード ───────────────────────────────
  const refresh = useCallback(async () => {
    if (!profile) return;

    try {
      // 進行中の打刻を復元
      const active = await getActiveLog(db, profile.id);
      if (active) {
        setIsTracking(true);
        setActiveLogId(active.id);
        setStartTime(active.startTime);
      } else {
        setIsTracking(false);
        setActiveLogId(null);
        setStartTime(null);
      }

      // 今日のログ
      const logs = await getTodayLogs(db, profile.id);
      setTodayLogs(logs);

      // カテゴリ
      const sections = await getActiveCategorySections(db);
      setCategorySections(sections);
    } finally {
      setIsLoading(false);
    }
  }, [db, profile]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ─── 打刻開始 ─────────────────────────────────
  const start = useCallback(async () => {
    if (!profile) return;

    const result = await insertTimeLog(db, profile.id, profile.tenant_id);
    setActiveLogId(result.id);
    setStartTime(result.startTime);
    setIsTracking(true);
  }, [db, profile]);

  // ─── 打刻終了 ─────────────────────────────────
  const stop = useCallback(
    async (categoryId: string) => {
      if (!activeLogId || !profile) return;

      await completeTimeLog(db, activeLogId, categoryId);

      // 状態リセット
      setIsTracking(false);
      setActiveLogId(null);
      setStartTime(null);

      // 今日のログを再取得
      const logs = await getTodayLogs(db, profile.id);
      setTodayLogs(logs);

      // 未同期件数を更新して同期トリガー
      await refreshPendingCount();
      triggerSync();
    },
    [db, activeLogId, profile, refreshPendingCount, triggerSync]
  );

  return {
    isTracking,
    elapsedSeconds,
    startTime,
    activeLogId,
    todayLogs,
    categorySections,
    isLoading,
    start,
    stop,
    refresh,
  };
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 現在時刻を JST の Date で返す */
export function nowJST(): Date {
  return new Date(Date.now() + JST_OFFSET_MS);
}

/** JST での「今日 00:00:00」を UTC ISO 文字列で返す */
export function getTodayStartUtc(): string {
  const jst = nowJST();
  const midnight = new Date(
    Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate())
  );
  return new Date(midnight.getTime() - JST_OFFSET_MS).toISOString();
}

/** UTC ISO 文字列 → "HH:mm" (JST) */
export function toJstTimeString(utcIso: string): string {
  const d = new Date(new Date(utcIso).getTime() + JST_OFFSET_MS);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** UTC ISO 文字列 → "MM/DD" (JST) */
export function toJstDateString(utcIso: string): string {
  const d = new Date(new Date(utcIso).getTime() + JST_OFFSET_MS);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${month}/${day}`;
}

/** 秒数 → "H:MM" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

/** 秒数 → "HH:MM:SS" (ストップウォッチ) */
export function formatStopwatch(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

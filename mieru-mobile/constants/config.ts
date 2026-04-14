export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export const COLORS = {
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  danger: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
  gray: "#9ca3af",
  grayLight: "#f3f4f6",
  grayDark: "#4b5563",
  white: "#ffffff",
  black: "#111827",
  syncOnline: "#22c55e",
  syncOffline: "#9ca3af",
  syncError: "#ef4444",
  syncSyncing: "#3b82f6",
} as const;

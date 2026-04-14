export type NetworkStatus = "online" | "offline";

export type SyncState = "idle" | "syncing" | "error";

export interface SyncStatus {
  networkStatus: NetworkStatus;
  syncState: SyncState;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
}

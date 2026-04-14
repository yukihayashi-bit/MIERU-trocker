/**
 * スタッフID + 病院コードからダミーメールを生成する。
 * Web版 (src/lib/dummy-email.ts) と同一ロジック。
 */
export function composeDummyEmail(
  staffId: string,
  hospitalCode: string
): string {
  return `${staffId}@${hospitalCode}.mieru-dummy.local`;
}

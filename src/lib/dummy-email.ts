/**
 * ダミーメール合成 / 復元ユーティリティ
 *
 * Supabase Auth は Email を必須とするが、医療現場のスタッフは
 * 個人メールアドレスを使わない。
 * そのため内部的に `{staff_id}@{hospital_code}.mieru-dummy.local`
 * 形式のダミーメールアドレスを生成して Auth に登録する。
 */

const DUMMY_DOMAIN = "mieru-dummy.local";

/** staff_id + hospital_code → ダミーメール */
export function composeDummyEmail(
  staffId: string,
  hospitalCode: string
): string {
  return `${staffId.toLowerCase()}@${hospitalCode.toLowerCase()}.${DUMMY_DOMAIN}`;
}

/** ダミーメール → { staffId, hospitalCode } に分解 */
export function parseDummyEmail(
  email: string
): { staffId: string; hospitalCode: string } | null {
  const suffix = `.${DUMMY_DOMAIN}`;
  if (!email.endsWith(suffix)) return null;

  const atIndex = email.indexOf("@");
  if (atIndex === -1) return null;

  const staffId = email.slice(0, atIndex);
  const hospitalCode = email.slice(atIndex + 1, email.length - suffix.length);

  if (!staffId || !hospitalCode) return null;
  return { staffId, hospitalCode };
}

/** メールアドレスがダミーかどうかを判定 */
export function isDummyEmail(email: string): boolean {
  return email.endsWith(`.${DUMMY_DOMAIN}`);
}

import { redirect } from "next/navigation";

/**
 * ログイン画面はモバイルアプリ側で行うため、
 * Web版（運営管理ツール）ではテナント一覧にリダイレクトする。
 */
export default function LoginPage() {
  redirect("/tenants");
}

import Link from "next/link";
import { getTenantList } from "@/app/actions/tenants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResetPasswordDialog } from "@/components/reset-password-dialog";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}`;
}

function statusLabel(status: string): { text: string; className: string } {
  switch (status) {
    case "active":
      return { text: "有効", className: "bg-green-100 text-green-800" };
    case "trial":
      return { text: "トライアル", className: "bg-blue-100 text-blue-800" };
    case "inactive":
      return { text: "無効", className: "bg-gray-100 text-gray-600" };
    default:
      return { text: status, className: "bg-gray-100 text-gray-600" };
  }
}

export default async function TenantsPage() {
  const tenants = await getTenantList();

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              発行済みテナント一覧
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              これまでに発行した病院アカウント ({tenants.length}件)
            </p>
          </div>
          <Link href="/signup">
            <Button>+ 新規発行</Button>
          </Link>
        </div>

        {/* テーブル */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">テナント管理</CardTitle>
            <CardDescription>
              病院名・病院コード・管理者情報を確認できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>まだテナントが登録されていません。</p>
                <Link href="/signup" className="mt-2 inline-block text-primary underline">
                  最初のテナントを発行する
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">病院名</th>
                      <th className="pb-3 pr-4 font-medium">病院コード</th>
                      <th className="pb-3 pr-4 font-medium">管理者</th>
                      <th className="pb-3 pr-4 font-medium">メール</th>
                      <th className="pb-3 pr-4 font-medium">ステータス</th>
                      <th className="pb-3 pr-4 font-medium">登録日時</th>
                      <th className="pb-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => {
                      const status = statusLabel(t.status);
                      return (
                        <tr
                          key={t.id}
                          className="border-b last:border-0 hover:bg-muted/50"
                        >
                          <td className="py-3 pr-4 font-medium">{t.name}</td>
                          <td className="py-3 pr-4">
                            <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                              {t.hospitalCode}
                            </code>
                          </td>
                          <td className="py-3 pr-4">{t.adminName}</td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {t.adminEmail}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}
                            >
                              {status.text}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                            {formatDate(t.createdAt)}
                          </td>
                          <td className="py-3">
                            {t.adminUserId && (
                              <ResetPasswordDialog
                                userId={t.adminUserId}
                                adminName={t.adminName}
                                hospitalName={t.name}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* フッター */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            MIERU 運営管理ツール &mdash; メディヴァ社内専用
          </p>
        </div>
      </div>
    </div>
  );
}

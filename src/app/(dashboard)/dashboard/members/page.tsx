import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, User } from "lucide-react";
import { getMembers } from "@/app/actions/members";
import { AddMemberDialog } from "./add-member-dialog";

export default async function MembersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, role, tenants(name)")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const members = await getMembers();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">メンバー管理</h1>
              <p className="text-xs text-muted-foreground">
                {(profile?.tenants as unknown as { name: string } | null)?.name ?? ""}
              </p>
            </div>
          </div>
          {isAdmin && <AddMemberDialog />}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              スタッフ一覧（{members.length}名）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                スタッフが登録されていません
              </p>
            ) : (
              /* モバイル: カード / デスクトップ: テーブル */
              <>
                {/* デスクトップ テーブル */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">名前</th>
                        <th className="pb-3 pr-4 font-medium">メールアドレス</th>
                        <th className="pb-3 pr-4 font-medium">ロール</th>
                        <th className="pb-3 font-medium">登録日</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                {m.role === "admin" ? (
                                  <Shield className="h-4 w-4 text-amber-600" />
                                ) : (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <span className="font-medium">{m.name}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {m.email}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                m.role === "admin"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {m.role === "admin" ? "管理者" : "スタッフ"}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {m.createdAt.slice(0, 10)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* モバイル カードリスト */}
                <div className="sm:hidden space-y-3">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-lg border px-3 py-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                        {m.role === "admin" ? (
                          <Shield className="h-5 w-5 text-amber-600" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {m.name}
                          </span>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              m.role === "admin"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {m.role === "admin" ? "管理者" : "スタッフ"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

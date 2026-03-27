import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStaffList } from "@/app/actions/staff";
import { AddStaffDialog } from "./add-staff-dialog";

export default async function StaffPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // admin 確認 + テナント情報取得
  const { data: profile } = await supabase
    .from("users")
    .select("role, tenants(name, hospital_code)")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const tenant = profile.tenants as unknown as { name: string; hospital_code: string } | null;
  const staffList = await getStaffList();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">スタッフ管理</h1>
              {tenant && (
                <p className="text-xs text-muted-foreground">
                  {tenant.name}
                </p>
              )}
            </div>
          </div>
          <AddStaffDialog />
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-6">
        {/* 病院コード表示 */}
        {tenant?.hospital_code && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">病院コード</p>
                  <p className="mt-0.5 text-2xl font-mono font-bold tracking-widest">
                    {tenant.hospital_code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    スタッフはこのコードと<br />
                    自分のスタッフIDでログインします
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* スタッフ一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              スタッフ一覧（{staffList.length}名）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {staffList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                スタッフがまだ登録されていません
              </p>
            ) : (
              <div className="space-y-0 divide-y">
                {staffList.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        s.role === "admin"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {s.role === "admin" ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {s.staffId}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.role === "admin"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {s.role === "admin" ? "管理者" : "スタッフ"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/app/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthState = {};

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          メディヴァ社内専用
        </div>
        <CardTitle className="text-xl">病院アカウント発行</CardTitle>
        <CardDescription>
          新しい病院とその管理者アカウントを発行します。
          <br />
          登録すると 8桁の病院コードが自動生成され、
          <br />
          病院側スタッフはそのコードでアプリにログインできます。
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="flex flex-col gap-4" id="signup-form">
          {state.error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* 病院名 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hospitalName">病院名</Label>
            <Input
              id="hospitalName"
              name="hospitalName"
              type="text"
              placeholder="○○病院"
              required
              aria-invalid={!!state.fieldErrors?.hospitalName}
            />
            {state.fieldErrors?.hospitalName && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.hospitalName}
              </p>
            )}
          </div>

          {/* 管理者氏名 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">管理者氏名</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="山田 太郎"
              required
              aria-invalid={!!state.fieldErrors?.name}
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              病院側の管理者として登録されます
            </p>
          </div>

          {/* メールアドレス */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">管理者メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@hospital.example.com"
              required
              aria-invalid={!!state.fieldErrors?.email}
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.email}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              病院側管理者がログインに使用するメールアドレスです
            </p>
          </div>

          {/* パスワード */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">初期パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="6文字以上"
              required
              minLength={6}
              aria-invalid={!!state.fieldErrors?.password}
            />
            {state.fieldErrors?.password && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.password}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              発行後、病院側管理者にこのパスワードを通知してください
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? "発行中..." : "病院アカウントを発行する"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          <Link
            href="/tenants"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            発行済みテナント一覧へ
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

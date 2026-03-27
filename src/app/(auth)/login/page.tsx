"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/app/actions/auth";
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

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [loginId, setLoginId] = useState("");

  // @ を含む → 管理者メールアドレスモード → 病院コード不要
  const isEmail = loginId.includes("@");

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">ログイン</CardTitle>
        <CardDescription>
          管理者はメールアドレス、スタッフはスタッフIDでログイン
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="flex flex-col gap-4" id="login-form">
          {state.error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* 病院コード（スタッフIDモード時のみ表示） */}
          {!isEmail && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hospitalCode">病院コード</Label>
              <Input
                id="hospitalCode"
                name="hospitalCode"
                type="text"
                placeholder="例: abc12345"
                autoCapitalize="none"
                autoCorrect="off"
                aria-invalid={!!state.fieldErrors?.hospitalCode}
              />
              {state.fieldErrors?.hospitalCode && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.hospitalCode}
                </p>
              )}
            </div>
          )}

          {/* hidden: メールモード時は空の hospitalCode を送信 */}
          {isEmail && <input type="hidden" name="hospitalCode" value="" />}

          {/* メールアドレス / スタッフID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="loginId">メールアドレス または スタッフID</Label>
            <Input
              id="loginId"
              name="loginId"
              type="text"
              placeholder="admin@example.com / nurse01"
              required
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              aria-invalid={!!state.fieldErrors?.loginId}
            />
            {state.fieldErrors?.loginId && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.loginId}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {isEmail
                ? "管理者メールアドレスで直接ログインします"
                : "スタッフIDの場合は病院コードも入力してください"}
            </p>
          </div>

          {/* パスワード */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="パスワード"
              required
              autoComplete="current-password"
              aria-invalid={!!state.fieldErrors?.password}
            />
            {state.fieldErrors?.password && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.password}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          病院の新規登録は{" "}
          <Link href="/signup" className="text-primary underline underline-offset-4 hover:text-primary/80">
            こちら
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

"use client";

import { useActionState } from "react";
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

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">ログイン</CardTitle>
        <CardDescription>
          メールアドレスとパスワードでログイン
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="flex flex-col gap-4" id="login-form">
          {state.error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* メール */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              required
              aria-invalid={!!state.fieldErrors?.email}
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.email}
              </p>
            )}
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
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="text-primary underline underline-offset-4 hover:text-primary/80">
            新規登録
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

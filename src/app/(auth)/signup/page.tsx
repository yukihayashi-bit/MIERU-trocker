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
        <CardTitle className="text-xl">新規登録</CardTitle>
        <CardDescription>
          病院の情報と管理者アカウントを作成します
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

          {/* 氏名 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">氏名</Label>
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
          </div>

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
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? "登録中..." : "アカウントを作成"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
            ログイン
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

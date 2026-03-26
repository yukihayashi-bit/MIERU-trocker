"use client";

import { useState, useActionState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMember, type AddMemberResult } from "@/app/actions/members";
import { UserPlus, AlertCircle } from "lucide-react";

export function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<AddMemberResult | null, FormData>(
    addMember,
    null
  );

  // 成功時にダイアログを閉じる
  useEffect(() => {
    if (state?.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="rounded-full" />}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        スタッフを追加
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>スタッフを追加</DialogTitle>
          <DialogDescription>
            新しいスタッフのアカウントを作成します。追加されたスタッフは打刻機能を利用できます。
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {/* エラー表示 */}
          {state && !state.success && state.error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{state.error}</p>
            </div>
          )}

          {/* 氏名 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-name">氏名</Label>
            <Input
              id="member-name"
              name="name"
              type="text"
              placeholder="山田 花子"
              required
              aria-invalid={!!(state && !state.success && state.fieldErrors?.name)}
            />
            {state && !state.success && state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>

          {/* メールアドレス */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-email">メールアドレス</Label>
            <Input
              id="member-email"
              name="email"
              type="email"
              placeholder="staff@example.com"
              required
              aria-invalid={!!(state && !state.success && state.fieldErrors?.email)}
            />
            {state && !state.success && state.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
            )}
          </div>

          {/* 初期パスワード */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-password">初期パスワード</Label>
            <Input
              id="member-password"
              name="password"
              type="text"
              placeholder="6文字以上"
              required
              minLength={6}
              aria-invalid={!!(state && !state.success && state.fieldErrors?.password)}
            />
            {state && !state.success && state.fieldErrors?.password && (
              <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              スタッフに共有してください。ログイン後に変更できます。
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "追加中..." : "追加する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

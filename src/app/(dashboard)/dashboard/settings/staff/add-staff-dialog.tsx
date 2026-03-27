"use client";

import { useState, useActionState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addStaff, type AddStaffResult } from "@/app/actions/staff";
import { UserPlus, AlertCircle } from "lucide-react";

export function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<AddStaffResult | null, FormData>(
    addStaff,
    null
  );

  // 成功時にダイアログを閉じる
  useEffect(() => {
    if (state?.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <>
      <Button className="rounded-full" onClick={() => setOpen(true)}>
        <UserPlus className="mr-1.5 h-4 w-4" />
        スタッフを追加
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>スタッフを追加</DialogTitle>
            <DialogDescription>
              新しいスタッフのアカウントを作成します。
              スタッフIDとパスワードを本人にお伝えください。
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

            {/* スタッフID */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-staffId">スタッフID</Label>
              <Input
                id="staff-staffId"
                name="staffId"
                type="text"
                placeholder="例: nurse01"
                required
                autoCapitalize="none"
                autoCorrect="off"
                aria-invalid={!!(state && !state.success && state.fieldErrors?.staffId)}
              />
              {state && !state.success && state.fieldErrors?.staffId && (
                <p className="text-xs text-destructive">{state.fieldErrors.staffId}</p>
              )}
              <p className="text-xs text-muted-foreground">
                半角英数字・ハイフン・アンダースコアが使えます
              </p>
            </div>

            {/* 氏名 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-name">氏名</Label>
              <Input
                id="staff-name"
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

            {/* ロール */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-role">ロール</Label>
              <select
                id="staff-role"
                name="role"
                defaultValue="user"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="user">スタッフ</option>
                <option value="admin">管理者</option>
              </select>
            </div>

            {/* 初期パスワード */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-password">初期パスワード</Label>
              <Input
                id="staff-password"
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
                スタッフに共有してください
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
    </>
  );
}

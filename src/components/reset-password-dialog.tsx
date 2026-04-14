"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetAdminPassword } from "@/app/actions/tenants";

interface ResetPasswordDialogProps {
  userId: string;
  adminName: string;
  hospitalName: string;
}

export function ResetPasswordDialog({
  userId,
  adminName,
  hospitalName,
}: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setIsSubmitting(true);
    const result = await resetAdminPassword(userId, password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        // 閉じた後にリセット
        setTimeout(() => {
          setPassword("");
          setSuccess(false);
          setError(null);
        }, 300);
      }, 1500);
    } else {
      setError(result.error ?? "パスワードの変更に失敗しました");
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      // ダイアログ閉じたらリセット
      setTimeout(() => {
        setPassword("");
        setSuccess(false);
        setError(null);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" />
        }
      >
        PW変更
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>管理者パスワード変更</DialogTitle>
          <DialogDescription>
            {hospitalName} の管理者「{adminName}」のパスワードを再設定します。
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="rounded-lg bg-green-50 px-3 py-4 text-center text-sm text-green-800 border border-green-200">
            パスワードを変更しました
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                変更後、病院側管理者に新パスワードを通知してください
              </p>
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                キャンセル
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "変更中..." : "パスワードを変更"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

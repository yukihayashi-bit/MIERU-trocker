"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

type Category = { id: string; name: string };

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSave: (categoryId: string) => Promise<void>;
}

export function CategoryDialog({
  open,
  onOpenChange,
  categories,
  onSave,
}: CategoryDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    await onSave(selected);
    setIsSaving(false);
    setSelected(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // ダイアログを閉じるときに選択をリセット
    if (!nextOpen) {
      setSelected(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>業務カテゴリの選択</DialogTitle>
          <DialogDescription>
            行った業務のカテゴリを選んでください
          </DialogDescription>
        </DialogHeader>

        {/* カテゴリ一覧（グリッド） */}
        <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto py-2">
          {categories.map((cat) => {
            const isSelected = selected === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelected(cat.id)}
                className={`relative flex items-center justify-center rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {isSelected && (
                  <CheckCircle className="absolute top-1.5 right-1.5 h-4 w-4 text-primary" />
                )}
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* 保存ボタン */}
        <Button
          className="w-full h-12 text-base font-bold rounded-xl"
          disabled={!selected || isSaving}
          onClick={handleSave}
        >
          {isSaving ? "保存中..." : "保存"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

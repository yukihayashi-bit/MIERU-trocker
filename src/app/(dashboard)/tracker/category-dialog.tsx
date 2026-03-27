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

// ─── tenant_categories + master_categories JOIN の型 ─────
export interface GroupedCategory {
  id: string;
  name: string;
  color: string;
  master_category_id: string;
  master_categories: { id: string; name: string } | { id: string; name: string }[] | null;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: GroupedCategory[];
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

  // マスターカテゴリごとにグループ化
  const grouped = new Map<string, { masterName: string; items: GroupedCategory[] }>();
  for (const cat of categories) {
    const mc = cat.master_categories;
    const masterName = mc
      ? (Array.isArray(mc) ? mc[0]?.name : mc.name) ?? "その他"
      : "その他";
    const masterId = cat.master_category_id;
    if (!grouped.has(masterId)) {
      grouped.set(masterId, { masterName, items: [] });
    }
    grouped.get(masterId)!.items.push(cat);
  }

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    await onSave(selected);
    setIsSaving(false);
    setSelected(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
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

        {/* マスターカテゴリごとにグループ表示 */}
        <div className="max-h-[55vh] overflow-y-auto space-y-4 py-2">
          {Array.from(grouped.entries()).map(([masterId, group]) => (
            <div key={masterId}>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.masterName}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map((cat) => {
                  const isSelected = selected === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelected(cat.id)}
                      className={`relative flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/40"
                      }`}
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate">{cat.name}</span>
                      {isSelected && (
                        <CheckCircle className="absolute top-1.5 right-1.5 h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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

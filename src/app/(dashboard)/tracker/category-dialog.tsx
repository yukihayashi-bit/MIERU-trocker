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
type MasterRef = { id: string; name: string; sort_order?: number | null };

export interface GroupedCategory {
  id: string;
  name: string;
  color: string;
  master_category_id: string;
  master_categories: MasterRef | MasterRef[] | null;
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

  // マスターカテゴリごとにグループ化（sort_order でソート）
  const grouped = new Map<string, { masterName: string; sortOrder: number; items: GroupedCategory[] }>();
  for (const cat of categories) {
    const mc = cat.master_categories;
    const resolved = mc ? (Array.isArray(mc) ? mc[0] : mc) : null;
    const masterName = resolved?.name ?? "その他";
    const sortOrder = resolved?.sort_order ?? 999;
    const masterId = cat.master_category_id;
    if (!grouped.has(masterId)) {
      grouped.set(masterId, { masterName, sortOrder, items: [] });
    }
    grouped.get(masterId)!.items.push(cat);
  }

  // sort_order 昇順でソート
  const sortedGroups = Array.from(grouped.entries()).sort(
    (a, b) => a[1].sortOrder - b[1].sortOrder
  );

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
          {sortedGroups.map(([masterId, group]) => (
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

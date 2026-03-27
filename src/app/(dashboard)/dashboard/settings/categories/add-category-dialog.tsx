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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addTenantCategory } from "@/app/actions/categories";
import { Plus, AlertCircle } from "lucide-react";

interface MasterCat {
  id: string;
  name: string;
  description: string | null;
}

interface AddCategoryDialogProps {
  masterCategories: MasterCat[];
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
  "#14b8a6", "#78716c",
];

export function AddCategoryDialog({ masterCategories }: AddCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [masterId, setMasterId] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !masterId) return;

    setIsSaving(true);
    setError(null);

    const result = await addTenantCategory(name, masterId, color);
    if (result.success) {
      setOpen(false);
      setName("");
      setMasterId("");
      setColor(PRESET_COLORS[0]);
    } else {
      setError(result.error ?? "追加に失敗しました");
    }
    setIsSaving(false);
  };

  return (
    <>
      <Button className="rounded-full" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        カテゴリを追加
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>業務カテゴリの追加</DialogTitle>
          <DialogDescription>
            マスターカテゴリ（レベル1）に紐づく業務カテゴリを追加します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* マスターカテゴリ選択 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="master-category">マスターカテゴリ（レベル1）</Label>
            <select
              id="master-category"
              value={masterId}
              onChange={(e) => setMasterId(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">選択してください</option>
              {masterCategories.map((mc) => (
                <option key={mc.id} value={mc.id}>
                  {mc.name}{mc.description ? ` — ${mc.description}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* カテゴリ名 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">カテゴリ名</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: バイタル測定"
              required
            />
          </div>

          {/* 色選択 */}
          <div className="flex flex-col gap-1.5">
            <Label>表示カラー</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSaving || !name.trim() || !masterId}>
            {isSaving ? "追加中..." : "追加する"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}

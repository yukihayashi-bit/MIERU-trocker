"use client";

import { useState } from "react";
import { toggleTenantCategory } from "@/app/actions/categories";

interface CategoryToggleProps {
  categoryId: string;
  initialActive: boolean;
}

export function CategoryToggle({ categoryId, initialActive }: CategoryToggleProps) {
  const [isActive, setIsActive] = useState(initialActive);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    const result = await toggleTenantCategory(categoryId, !isActive);
    if (result.success) {
      setIsActive(!isActive);
    }
    setIsUpdating(false);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isUpdating}
      role="switch"
      aria-checked={isActive}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
          isActive ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

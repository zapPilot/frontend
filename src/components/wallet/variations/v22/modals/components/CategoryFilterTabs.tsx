"use client";

import { ASSET_CATEGORIES } from "@/constants/portfolio";
import type { CategoryFilter } from "@/lib/assetCategoryUtils";

interface CategoryFilterTabsProps {
  activeCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
}

const TAB_COLORS = {
  all: {
    active: "border-red-500/50 bg-red-500/10 text-white",
    inactive:
      "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-gray-300",
  },
  btc: {
    active: "border-amber-500/50 bg-amber-500/10 text-amber-300",
    inactive:
      "border-gray-800 bg-gray-900 text-gray-400 hover:border-amber-500/30 hover:text-amber-400",
  },
  eth: {
    active: "border-indigo-500/50 bg-indigo-500/10 text-indigo-300",
    inactive:
      "border-gray-800 bg-gray-900 text-gray-400 hover:border-indigo-500/30 hover:text-indigo-400",
  },
  stablecoin: {
    active: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    inactive:
      "border-gray-800 bg-gray-900 text-gray-400 hover:border-emerald-500/30 hover:text-emerald-400",
  },
  altcoin: {
    active: "border-purple-500/50 bg-purple-500/10 text-purple-300",
    inactive:
      "border-gray-800 bg-gray-900 text-gray-400 hover:border-purple-500/30 hover:text-purple-400",
  },
} as const;

export function CategoryFilterTabs({
  activeCategory,
  onCategoryChange,
}: CategoryFilterTabsProps) {
  const categories: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: "ALL" },
    { key: "btc", label: ASSET_CATEGORIES.btc.shortLabel },
    { key: "eth", label: ASSET_CATEGORIES.eth.shortLabel },
    { key: "altcoin", label: "ALT" },
    { key: "stablecoin", label: "Stables" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Asset category filter"
      className="grid grid-cols-5 gap-2"
    >
      {categories.map(({ key, label }) => {
        const isActive = activeCategory === key;
        const colors = TAB_COLORS[key];

        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            aria-controls="asset-selector-panel"
            onClick={() => onCategoryChange(key)}
            data-testid={`category-tab-${key}`}
            className={`
              h-10 rounded-lg border font-bold text-xs uppercase tracking-wide transition-all duration-200
              ${isActive ? colors.active : colors.inactive}
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { ASSET_CATEGORIES } from "@/constants/portfolio";
import type {
  AssetCategoryKey,
  CategoryFilter,
} from "@/lib/assetCategoryUtils";

interface CategoryPillsProps {
  activeCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  tokenCounts?: Record<AssetCategoryKey, number>;
  showCounts?: boolean;
}

const CATEGORY_COLORS = {
  all: "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600",
  btc: "border-amber-500/50 bg-amber-500/10 text-amber-400 hover:border-amber-500/70",
  eth: "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:border-indigo-500/70",
  stablecoin:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/70",
  altcoin:
    "border-purple-500/50 bg-purple-500/10 text-purple-400 hover:border-purple-500/70",
} as const;

const ACTIVE_COLORS = {
  all: "border-gray-500 bg-gray-700/50 text-white",
  btc: "border-amber-500 bg-amber-500/20 text-amber-300",
  eth: "border-indigo-500 bg-indigo-500/20 text-indigo-300",
  stablecoin: "border-emerald-500 bg-emerald-500/20 text-emerald-300",
  altcoin: "border-purple-500 bg-purple-500/20 text-purple-300",
} as const;

export function CategoryPills({
  activeCategory,
  onCategoryChange,
  tokenCounts,
  showCounts = true,
}: CategoryPillsProps) {
  const categories: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "btc", label: ASSET_CATEGORIES.btc.shortLabel },
    { key: "eth", label: ASSET_CATEGORIES.eth.shortLabel },
    { key: "stablecoin", label: "Stables" },
    { key: "altcoin", label: "ALT" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map(({ key, label }) => {
        const isActive = activeCategory === key;
        const count = key !== "all" && tokenCounts ? tokenCounts[key] : null;
        const showCount = showCounts && count !== null;

        return (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            aria-pressed={isActive}
            data-testid={`category-pill-${key}`}
            className={`
              flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-200
              ${isActive ? ACTIVE_COLORS[key] : CATEGORY_COLORS[key]}
            `}
          >
            <span>{label}</span>
            {showCount && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  isActive ? "bg-black/20" : "bg-black/30"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { ASSET_CATEGORIES } from "@/constants/portfolio";
import type { AssetCategoryKey } from "@/lib/assetCategoryUtils";

interface CategoryCardProps {
  category: AssetCategoryKey;
  totalUsd: number;
  tokenCount: number;
  tokens: string[]; // Token symbols in this category
  isSelected: boolean;
  onSelect: () => void;
  onViewBreakdown?: () => void;
}

const CATEGORY_ICONS = {
  btc: "₿",
  eth: "Ξ",
  stablecoin: "$",
  altcoin: "⭐",
} as const;

const CARD_COLORS = {
  btc: {
    border: "border-amber-500/30",
    activeBorder: "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    bg: "bg-amber-500/5",
    icon: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  eth: {
    border: "border-indigo-500/30",
    activeBorder:
      "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]",
    bg: "bg-indigo-500/5",
    icon: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  },
  stablecoin: {
    border: "border-emerald-500/30",
    activeBorder:
      "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    bg: "bg-emerald-500/5",
    icon: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  altcoin: {
    border: "border-purple-500/30",
    activeBorder: "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]",
    bg: "bg-purple-500/5",
    icon: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
} as const;

export function CategoryCard({
  category,
  totalUsd,
  tokenCount,
  tokens,
  isSelected,
  onSelect,
  onViewBreakdown,
}: CategoryCardProps) {
  const categoryInfo = ASSET_CATEGORIES[category];
  const colors = CARD_COLORS[category];
  const icon = CATEGORY_ICONS[category];

  // Show first 3 tokens
  const displayTokens = tokens.slice(0, 3);
  const hasMore = tokens.length > 3;

  return (
    <button
      onClick={onSelect}
      aria-pressed={isSelected}
      data-testid={`category-card-${category}`}
      className={`
        relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        ${isSelected ? colors.activeBorder : colors.border}
        ${colors.bg}
      `}
      style={{ minHeight: "140px" }}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-lg ${colors.icon} border flex items-center justify-center text-2xl font-bold mb-3`}
      >
        {icon}
      </div>

      {/* Category Name */}
      <div className="mb-2">
        <h4 className="font-bold text-white text-sm">
          {categoryInfo.label}
        </h4>
      </div>

      {/* USD Total */}
      <div className="mb-2">
        <div className="text-2xl font-bold text-white">
          ${totalUsd.toLocaleString()}
        </div>
      </div>

      {/* Token Count */}
      <div className="mb-2 text-xs text-gray-400">
        {tokenCount} {tokenCount === 1 ? "asset" : "assets"}
      </div>

      {/* Token Symbols Preview */}
      <div className="flex items-center gap-1 flex-wrap text-[11px] text-gray-500">
        {displayTokens.map((symbol, idx) => (
          <span key={idx}>
            {symbol}
            {idx < displayTokens.length - 1 && " •"}
          </span>
        ))}
        {hasMore && <span>• +{tokens.length - 3} more</span>}
      </div>

      {/* Breakdown Link */}
      {onViewBreakdown && (
        <button
          onClick={e => {
            e.stopPropagation();
            onViewBreakdown();
          }}
          className="absolute bottom-2 right-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500 hover:text-white transition-colors"
        >
          View →
        </button>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
          <svg
            className="w-4 h-4 text-gray-950"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

"use client";

import { ArrowRight } from "lucide-react";
import React from "react";

import { useResolvedBalanceVisibility } from "../hooks/useResolvedBalanceVisibility";
import { formatCurrency, formatPercentage } from "../lib/formatters";
import type { CategorySummary } from "../utils/portfolio.utils";

interface CategoryItemProps {
  category: CategorySummary;
  onCategoryClick?: (id: string) => void;
  isNavigating?: boolean;
  variant: "assets" | "borrowing";
}

export const CategoryItem = React.memo(
  ({ category, onCategoryClick, isNavigating, variant }: CategoryItemProps) => {
    const balanceHidden = useResolvedBalanceVisibility();
    const isAssets = variant === "assets";
    const cardClasses = isAssets
      ? "border border-gray-800 rounded-2xl p-4 bg-gray-900/20 transition-all duration-200"
      : "border border-orange-800 rounded-2xl p-4 bg-orange-900/20 transition-all duration-200";
    const hoverClasses = onCategoryClick
      ? isAssets
        ? "hover:bg-gray-900/40 hover:border-gray-700 hover:scale-[1.02] cursor-pointer hover:shadow-lg hover:shadow-purple-500/10"
        : "hover:bg-orange-900/40 hover:border-orange-700 hover:scale-[1.02] cursor-pointer hover:shadow-lg hover:shadow-orange-500/10"
      : "";
    const disabledClasses = isNavigating
      ? "opacity-75 pointer-events-none"
      : "";

    const dotStyle = React.useMemo(
      () => ({ backgroundColor: category.color }),
      [category.color]
    );

    const handleClick = React.useCallback(() => {
      onCategoryClick?.(category.id);
    }, [onCategoryClick, category.id]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (onCategoryClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onCategoryClick(category.id);
        }
      },
      [onCategoryClick, category.id]
    );

    return (
      <div
        className={`${cardClasses} ${hoverClasses} ${disabledClasses}`}
        onClick={handleClick}
        role={onCategoryClick ? "button" : undefined}
        tabIndex={onCategoryClick ? 0 : undefined}
        aria-label={
          onCategoryClick
            ? `View ${category.name} ${isAssets ? "analytics" : "debt analytics"}`
            : undefined
        }
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full" style={dotStyle} />
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                {category.name}
                {onCategoryClick && (
                  <ArrowRight
                    className={
                      isAssets
                        ? "w-4 h-4 text-gray-400 transition-colors group-hover:text-white"
                        : "w-4 h-4 text-orange-400 transition-colors group-hover:text-white"
                    }
                  />
                )}
              </div>
              <div
                className={
                  isAssets ? "text-sm text-gray-400" : "text-sm text-orange-400"
                }
              >
                {formatPercentage(category.percentage, false, 1)}{" "}
                {isAssets ? "of total" : "of debt"}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div
              className={
                isAssets
                  ? "font-semibold text-white"
                  : "font-semibold text-orange-400"
              }
            >
              {formatCurrency(category.totalValue, { isHidden: balanceHidden })}
            </div>
            {isAssets ? (
              <div className="text-sm text-green-400 flex items-center justify-end gap-1">
                APR: Coming soon
              </div>
            ) : (
              <div className="text-sm text-orange-300 text-right">Borrowed</div>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.category.id === next.category.id &&
      prev.category.totalValue === next.category.totalValue &&
      prev.category.percentage === next.category.percentage &&
      prev.isNavigating === next.isNavigating &&
      prev.onCategoryClick === next.onCategoryClick &&
      prev.variant === next.variant
    );
  }
);

CategoryItem.displayName = "CategoryItem";

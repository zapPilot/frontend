"use client";

import {
  MAX_ALLOCATION_PERCENT,
  MIN_ALLOCATION_PERCENT,
} from "@/constants/portfolio-allocation";
import { formatCurrency } from "@/lib/formatters";
import { memo } from "react";
import { CategoryShift, ProcessedAssetCategory } from "../../types";

interface CategoryAllocationSummaryProps {
  category: ProcessedAssetCategory;
  excluded: boolean;
  showRebalanceInfo: boolean;
  rebalanceShift?: CategoryShift;
  rebalanceTarget?: ProcessedAssetCategory;
  allocation?: number | undefined;
  onAllocationChange?: ((value: number) => void) | undefined;
}

export const CategoryAllocationSummary = memo<CategoryAllocationSummaryProps>(
  ({
    category,
    excluded,
    showRebalanceInfo,
    rebalanceShift,
    rebalanceTarget,
    allocation,
    onAllocationChange,
  }) => {
    if (showRebalanceInfo && rebalanceShift && rebalanceTarget) {
      return (
        <div className="space-y-1" data-testid={`allocation-${category.id}`}>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-400">
              {category.activeAllocationPercentage.toFixed(1)}%
            </div>
            <span className="text-gray-500">→</span>
            <div
              className={`font-bold ${
                rebalanceShift.action === "increase"
                  ? "text-green-400"
                  : rebalanceShift.action === "decrease"
                    ? "text-red-400"
                    : "text-white"
              }`}
            >
              {rebalanceTarget.activeAllocationPercentage.toFixed(1)}%
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <div
              className={`${
                rebalanceShift.action === "increase"
                  ? "text-green-400"
                  : rebalanceShift.action === "decrease"
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            >
              {rebalanceShift.changeAmount > 0 ? "+" : ""}
              {rebalanceShift.changeAmount.toFixed(1)}%
            </div>
            <div className="text-gray-500">•</div>
            <div className="text-gray-400">
              {rebalanceShift.actionDescription}
            </div>
          </div>
        </div>
      );
    }

    const allocationValue = allocation ?? category.totalAllocationPercentage;

    const handleAllocationInput = (value: number) => {
      if (!onAllocationChange) return;
      if (Number.isNaN(value)) return;
      onAllocationChange(value);
    };

    const targetAllocation = excluded ? 0 : allocationValue;
    const formattedCategoryValue = formatCurrency(category.totalValue);

    const valueSummary = (
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="mt-0.5">{formattedCategoryValue}</div>
      </div>
    );

    if (!excluded && onAllocationChange) {
      return (
        <div
          data-testid={`allocation-${category.id}`}
          className="flex flex-col gap-3"
        >
          <div className="text-xs text-gray-500">
            Current: {category.activeAllocationPercentage.toFixed(1)}%
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={MIN_ALLOCATION_PERCENT}
                max={MAX_ALLOCATION_PERCENT}
                step={0.5}
                value={targetAllocation}
                onChange={event =>
                  handleAllocationInput(Number(event.target.value))
                }
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-700 hover:bg-gray-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                data-testid={`allocation-slider-${category.id}`}
                aria-label="Adjust target allocation"
              />
              {valueSummary}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        data-testid={`allocation-${category.id}`}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {excluded
              ? "Category excluded"
              : `Current: ${category.activeAllocationPercentage.toFixed(1)}%`}
          </div>
          {valueSummary}
        </div>
      </div>
    );
  }
);

CategoryAllocationSummary.displayName = "CategoryAllocationSummary";

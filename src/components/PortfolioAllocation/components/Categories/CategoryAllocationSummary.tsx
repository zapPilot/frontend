"use client";

import { memo } from "react";
import { ProcessedAssetCategory, CategoryShift } from "../../types";

interface CategoryAllocationSummaryProps {
  category: ProcessedAssetCategory;
  excluded: boolean;
  showRebalanceInfo: boolean;
  rebalanceShift?: CategoryShift;
  rebalanceTarget?: ProcessedAssetCategory;
}

export const CategoryAllocationSummary = memo<CategoryAllocationSummaryProps>(
  ({
    category,
    excluded,
    showRebalanceInfo,
    rebalanceShift,
    rebalanceTarget,
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

    return (
      <div data-testid={`allocation-${category.id}`}>
        <div
          className={`font-bold ${excluded ? "text-gray-500" : "text-white"}`}
        >
          {excluded
            ? "0%"
            : `${category.activeAllocationPercentage.toFixed(1)}%`}
        </div>
        {!excluded && (
          <div className="text-sm text-gray-400">
            ${category.totalValue.toLocaleString()}
          </div>
        )}
      </div>
    );
  }
);

CategoryAllocationSummary.displayName = "CategoryAllocationSummary";

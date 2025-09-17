"use client";

import { memo } from "react";
import { ProcessedAssetCategory, CategoryShift } from "../../types";
import { AssetCategoryRow } from "./CategoryRow";

interface CategoryListSectionProps {
  categories: ProcessedAssetCategory[];
  excludedCategoryIdsSet: Set<string>;
  onToggleCategoryExclusion: (categoryId: string) => void;
  rebalanceShiftMap?: Map<string, CategoryShift>;
  rebalanceTargetMap?: Map<string, ProcessedAssetCategory>;
  isRebalanceEnabled?: boolean;
  testId?: string;
}

export const CategoryListSection = memo<CategoryListSectionProps>(
  ({
    categories,
    excludedCategoryIdsSet,
    onToggleCategoryExclusion,
    rebalanceShiftMap,
    rebalanceTargetMap,
    isRebalanceEnabled = false,
    testId = "allocation-list",
  }) => {
    if (categories.length === 0) {
      return (
        <div
          className="space-y-4 text-center text-sm text-gray-400"
          data-testid={testId}
        >
          No categories available.
        </div>
      );
    }

    return (
      <div className="space-y-4" data-testid={testId}>
        {categories.map(category => {
          const shift = rebalanceShiftMap?.get(category.id);
          const target = rebalanceTargetMap?.get(category.id);
          return (
            <AssetCategoryRow
              key={category.id}
              category={category}
              isExcluded={excludedCategoryIdsSet.has(category.id)}
              onToggleCategoryExclusion={onToggleCategoryExclusion}
              isRebalanceEnabled={isRebalanceEnabled}
              {...(shift ? { rebalanceShift: shift } : {})}
              {...(target ? { rebalanceTarget: target } : {})}
            />
          );
        })}
      </div>
    );
  }
);

CategoryListSection.displayName = "CategoryListSection";

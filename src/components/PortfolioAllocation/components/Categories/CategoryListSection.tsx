"use client";

import { memo, useMemo } from "react";
import {
  ProcessedAssetCategory,
  RebalanceMode,
  CategoryShift,
} from "../../types";
import { AssetCategoryRow } from "./CategoryRow";

interface CategoryListSectionProps {
  categories: ProcessedAssetCategory[];
  excludedCategoryIds: string[];
  onToggleCategoryExclusion: (categoryId: string) => void;
  rebalanceMode?: RebalanceMode | undefined;
  testId?: string;
}

export const CategoryListSection = memo<CategoryListSectionProps>(
  ({
    categories,
    excludedCategoryIds,
    onToggleCategoryExclusion,
    rebalanceMode,
    testId = "allocation-list",
  }) => {
    const excludedCategoryIdsSet = useMemo(
      () => new Set(excludedCategoryIds),
      [excludedCategoryIds]
    );
    const { shiftMap, targetMap } = useMemo(() => {
      if (!rebalanceMode?.data) {
        return {
          shiftMap: undefined as Map<string, CategoryShift> | undefined,
          targetMap: undefined as
            | Map<string, ProcessedAssetCategory>
            | undefined,
        };
      }

      const nextShiftMap = new Map<string, CategoryShift>();
      for (const shift of rebalanceMode.data.shifts) {
        nextShiftMap.set(shift.categoryId, shift);
      }

      const nextTargetMap = new Map<string, ProcessedAssetCategory>();
      for (const target of rebalanceMode.data.target) {
        nextTargetMap.set(target.id, target);
      }

      return {
        shiftMap: nextShiftMap,
        targetMap: nextTargetMap,
      };
    }, [rebalanceMode]);
    const isRebalanceEnabled = Boolean(rebalanceMode?.isEnabled);

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
          const shift = shiftMap?.get(category.id);
          const target = targetMap?.get(category.id);
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

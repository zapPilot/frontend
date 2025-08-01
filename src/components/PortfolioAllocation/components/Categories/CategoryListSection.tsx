"use client";

import { memo } from "react";
import { ProcessedAssetCategory, RebalanceMode } from "../../types";
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
    return (
      <div className="space-y-4" data-testid={testId}>
        {categories.map(category => (
          <AssetCategoryRow
            key={category.id}
            category={category}
            excludedCategoryIds={excludedCategoryIds}
            onToggleCategoryExclusion={onToggleCategoryExclusion}
            {...(rebalanceMode ? { rebalanceMode } : {})}
          />
        ))}
      </div>
    );
  }
);

CategoryListSection.displayName = "CategoryListSection";

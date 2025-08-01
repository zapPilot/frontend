import { useMemo } from "react";
import { ProcessedAssetCategory } from "../types";

/**
 * Hook to filter categories into included and excluded groups
 * Separates business logic for category filtering from UI components
 */
export const useCategoryFilters = (
  processedCategories: ProcessedAssetCategory[]
) => {
  return useMemo(
    () => ({
      includedCategories: processedCategories.filter(cat => !cat.isExcluded),
      excludedCategories: processedCategories.filter(cat => cat.isExcluded),
    }),
    [processedCategories]
  );
};

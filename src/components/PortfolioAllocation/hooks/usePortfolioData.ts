import { useMemo } from "react";
import { AssetCategory } from "../types";
import { processAssetCategories } from "../utils";

interface UsePortfolioDataOptions {
  allocationOverrides?: Record<string, number>;
  totalPortfolioValue?: number;
}

export const usePortfolioData = (
  assetCategories: AssetCategory[],
  excludedCategoryIds: string[],
  options: UsePortfolioDataOptions = {}
) => {
  return useMemo(
    () => processAssetCategories(assetCategories, excludedCategoryIds, options),
    [assetCategories, excludedCategoryIds, options]
  );
};

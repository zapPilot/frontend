import { useMemo } from "react";
import { AssetCategory } from "../types";
import { processAssetCategories } from "../utils";

export const usePortfolioData = (
  assetCategories: AssetCategory[],
  excludedCategoryIds: string[]
) => {
  return useMemo(
    () => processAssetCategories(assetCategories, excludedCategoryIds),
    [assetCategories, excludedCategoryIds]
  );
};

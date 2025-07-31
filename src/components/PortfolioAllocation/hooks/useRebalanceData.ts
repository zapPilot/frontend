import { useMemo } from "react";
import { ProcessedAssetCategory } from "../types";
import { generateRebalanceData } from "../utils";

export const useRebalanceData = (
  processedCategories: ProcessedAssetCategory[],
  isRebalanceMode: boolean
) => {
  return useMemo(() => {
    if (!isRebalanceMode) return undefined;
    return generateRebalanceData(processedCategories);
  }, [isRebalanceMode, processedCategories]);
};

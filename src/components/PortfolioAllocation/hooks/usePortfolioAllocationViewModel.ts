import { useMemo } from "react";

import {
  CategoryShift,
  ChartDataPoint,
  ProcessedAssetCategory,
  RebalanceMode,
} from "../types";
import { useCategoryFilters, useTargetChartData } from ".";

interface PortfolioAllocationViewModelParams {
  processedCategories: ProcessedAssetCategory[];
  rebalanceMode?: RebalanceMode | undefined;
  excludedCategoryIds: string[];
  chartData: ChartDataPoint[];
}

interface PortfolioAllocationViewModel {
  includedCategories: ProcessedAssetCategory[];
  excludedCategories: ProcessedAssetCategory[];
  excludedCategoryIdsSet: Set<string>;
  targetChartData: ChartDataPoint[];
  rebalanceShiftMap?: Map<string, CategoryShift>;
  rebalanceTargetMap?: Map<string, ProcessedAssetCategory>;
  isRebalanceEnabled: boolean;
  totalCategories: number;
}

export function usePortfolioAllocationViewModel({
  processedCategories,
  rebalanceMode,
  excludedCategoryIds,
  chartData,
}: PortfolioAllocationViewModelParams): PortfolioAllocationViewModel {
  const { includedCategories, excludedCategories } =
    useCategoryFilters(processedCategories);
  const excludedCategoryIdsSet = useMemo(
    () => new Set(excludedCategoryIds),
    [excludedCategoryIds]
  );

  const { shiftMap, targetMap } = useMemo(() => {
    if (!rebalanceMode?.data) {
      return {
        shiftMap: undefined,
        targetMap: undefined,
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
  const targetChartData = useTargetChartData(rebalanceMode);

  return {
    includedCategories,
    excludedCategories,
    excludedCategoryIdsSet,
    targetChartData: isRebalanceEnabled ? targetChartData : chartData,
    ...(shiftMap ? { rebalanceShiftMap: shiftMap } : {}),
    ...(targetMap ? { rebalanceTargetMap: targetMap } : {}),
    isRebalanceEnabled,
    totalCategories: processedCategories.length,
  };
}

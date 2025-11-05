import { useMemo } from "react";

import { ChartDataPoint, RebalanceMode } from "../types";

/**
 * Hook to transform rebalance target data into chart data points
 * Extracts and memoizes the target chart data transformation logic
 */
export const useTargetChartData = (
  rebalanceMode?: RebalanceMode
): ChartDataPoint[] => {
  return useMemo(() => {
    return (
      rebalanceMode?.data?.target
        .filter(cat => !cat.isExcluded)
        .map(cat => ({
          name: cat.name,
          value: cat.activeAllocationPercentage,
          id: cat.id,
          color: cat.color,
          isExcluded: false,
        })) || []
    );
  }, [rebalanceMode?.data?.target]);
};

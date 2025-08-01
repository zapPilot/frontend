import { useMemo } from "react";
import { ChartDataPoint } from "../types";
import { PieChartData } from "../../../types/portfolio";

/**
 * Hook to transform chart data points into PieChartData format
 * Centralizes the data transformation logic used across chart components
 */
export const useChartDataTransforms = (
  chartData: ChartDataPoint[]
): PieChartData[] => {
  return useMemo(
    () =>
      chartData.map(
        item =>
          ({
            label: item.name,
            value: Math.round(item.value * 100),
            percentage: item.value,
            color: item.color,
          }) as PieChartData
      ),
    [chartData]
  );
};

import { useMemo } from "react";

import { transformToPieChartData } from "@/lib/chartUtils";
import { PieChartData } from "@/types/domain/portfolio";

import { ChartDataPoint } from "../types";

/**
 * Hook to transform chart data points into PieChartData format
 * Centralizes the data transformation logic used across chart components
 */
export const useChartDataTransforms = (
  chartData: ChartDataPoint[]
): PieChartData[] => {
  return useMemo(
    () =>
      transformToPieChartData(
        chartData.map(item => ({
          id: item.id,
          label: item.name,
          value: item.value,
          percentage: item.value,
          color: item.color,
        })),
        { deriveCategoryMetadata: false }
      ),
    [chartData]
  );
};

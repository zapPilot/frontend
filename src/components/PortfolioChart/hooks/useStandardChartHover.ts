/**
 * useStandardChartHover - Standardized chart hover hook
 *
 * Reduces duplication across chart components by providing a consistent
 * hover setup pattern with date formatting and test auto-populate support.
 *
 * Extracted from SharpeChart, VolatilityChart, DailyYieldChart, and PerformanceChart
 * to eliminate ~24 LOC of duplication.
 */

import { useChartHover } from "../../../hooks/useChartHover";
import { ENABLE_TEST_AUTO_HOVER } from "../utils";

interface StandardChartHoverConfig<T extends { date: string }> {
  chartType: string;
  chartWidth: number;
  chartHeight: number;
  chartPadding: number;
  minValue: number;
  maxValue: number;
  getYValue: (point: T) => number;
  buildChartSpecificData: (point: T) => Record<string, unknown>;
}

/**
 * Creates a standardized chart hover handler with consistent date formatting.
 *
 * @example
 * ```tsx
 * const sharpeHover = useStandardChartHover(data, {
 *   chartType: "sharpe",
 *   chartWidth: width,
 *   chartHeight: height,
 *   chartPadding: padding,
 *   minValue: SHARPE_CONSTANTS.MIN_VALUE,
 *   maxValue: SHARPE_CONSTANTS.MAX_VALUE,
 *   getYValue: point => point.sharpe,
 *   buildChartSpecificData: point => ({
 *     sharpe: point.sharpe ?? 0,
 *     interpretation: getSharpeInterpretation(point.sharpe ?? 0),
 *   }),
 * });
 * ```
 */
export function useStandardChartHover<T extends { date: string }>(
  data: T[],
  config: StandardChartHoverConfig<T>
) {
  return useChartHover(data, {
    chartType: config.chartType,
    chartWidth: config.chartWidth,
    chartHeight: config.chartHeight,
    chartPadding: config.chartPadding,
    minValue: config.minValue,
    maxValue: config.maxValue,
    getYValue: config.getYValue,
    buildHoverData: (point, x, y) =>
      ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chartType: config.chartType as any,
        x,
        y,
        date: new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        ...config.buildChartSpecificData(point),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
  });
}

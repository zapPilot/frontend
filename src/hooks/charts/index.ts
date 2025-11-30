/**
 * Charts Hooks Module
 *
 * Extracted chart data processing hooks from the massive useChartData hook.
 * Each hook focuses on a specific chart type for better maintainability and testability.
 *
 * @module hooks/charts
 */

export {
  type AllocationPieChartDataPoint,
  type CurrentAllocation,
  useAllocationData,
  type UseAllocationDataParams,
  type UseAllocationDataResult,
} from "./useAllocationData";
export {
  type DrawdownDataPoint,
  type DrawdownMetrics,
  useDrawdownAnalysis,
  type UseDrawdownAnalysisParams,
  type UseDrawdownAnalysisResult,
} from "./useDrawdownAnalysis";
export {
  usePortfolioHistoryData,
  type UsePortfolioHistoryDataParams,
  type UsePortfolioHistoryDataResult,
} from "./usePortfolioHistoryData";
export {
  type DailyYieldDataPoint,
  type SharpeDataPoint,
  type SharpeInterpretation,
  useRollingAnalytics,
  type UseRollingAnalyticsParams,
  type UseRollingAnalyticsResult,
  type VolatilityDataPoint,
  type VolatilityRiskLevel,
} from "./useRollingAnalytics";

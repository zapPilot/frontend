/**
 * Charts Hooks Module
 *
 * Extracted chart data processing hooks from the massive useChartData hook.
 * Each hook focuses on a specific chart type for better maintainability and testability.
 *
 * @module hooks/charts
 */

export { useAllocationData } from "./useAllocationData";
export { useDrawdownAnalysis } from "./useDrawdownAnalysis";
export { usePortfolioHistoryData } from "./usePortfolioHistoryData";
export { useRollingAnalytics } from "./useRollingAnalytics";

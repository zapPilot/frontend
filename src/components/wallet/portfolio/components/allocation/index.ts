export { AllocationLegend } from "./AllocationLegend";
export { UnifiedAllocationBar } from "./UnifiedAllocationBar";

// Type exports
export type {
  BacktestConstituentsSource,
  LegacyAllocationConstituent,
  PortfolioAllocationSource,
  StrategyBucketsSource,
  UnifiedAllocationBarProps,
  UnifiedCategory,
  UnifiedSegment,
} from "./unifiedAllocationTypes";

// Utility exports
export {
  calculateTotalPercentage,
  getAllocationSummary,
  mapBacktestToUnified,
  mapLegacyConstituentsToUnified,
  mapPortfolioToUnified,
  mapStrategyToUnified,
} from "./unifiedAllocationUtils";

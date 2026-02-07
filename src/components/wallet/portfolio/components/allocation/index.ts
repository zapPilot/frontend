// Legacy components (will be deprecated after migration)
export { AllocationBars } from "./AllocationBars";
export { AllocationBarTooltip } from "./AllocationBarTooltip";
export { AllocationLegend } from "./AllocationLegend";
export { TargetAllocationBar } from "./TargetAllocationBar";

// Unified Allocation Bar (new)
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

/**
 * @deprecated Use AllocationBarTooltip instead
 *
 * Renamed to avoid conflict with chart AllocationTooltip component.
 */
export { AllocationBarTooltip as AllocationTooltip } from "./AllocationBarTooltip";

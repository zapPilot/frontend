/**
 * Consolidated Metrics Components
 *
 * Export all consolidated metric variations and utilities
 */

export { TabbedMetricsCard } from "./TabbedMetricsCard";
export { UnifiedMetricsCard } from "./UnifiedMetricsCard";
export { AccordionMetricsCard } from "./AccordionMetricsCard";

export type {
  MetricType,
  ConsolidatedMetricsProps,
  ConsolidatedMetricsData,
  ROIMetricData,
  PnLMetricData,
  YieldMetricData,
  ProtocolYieldBreakdown,
  TabbedMetricsState,
  AccordionSectionState,
  UnifiedCardLayout,
  AnimationConfig,
} from "./types";

export {
  generateMockROIData,
  generateMockPnLData,
  generateMockYieldData,
  generateMockConsolidatedData,
  generateCustomMockData,
  generateLoadingMockData,
  generatePartialLoadingMockData,
  MOCK_DATA_PRESETS,
} from "./mockData";

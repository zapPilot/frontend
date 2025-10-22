/**
 * PortfolioChart - Legacy export wrapper
 *
 * This file maintains backward compatibility for existing imports.
 * The implementation has been moved to ./PortfolioChart/ directory.
 *
 * @deprecated Import from './PortfolioChart' directory instead
 */
export {
  PortfolioChart,
  default,
} from "./PortfolioChart/PortfolioChartContainer";
export { buildAllocationHistory } from "./PortfolioChart/utils";
export type {
  PortfolioChartProps,
  AllocationTimeseriesInputPoint,
  DrawdownOverridePoint,
  SharpeOverridePoint,
  VolatilityOverridePoint,
  UnderwaterOverridePoint,
  PortfolioStackedDataPoint,
} from "./PortfolioChart/types";

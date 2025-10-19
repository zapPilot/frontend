/**
 * Chart Hover Type Definitions
 *
 * Discriminated union types for all chart hover states in the portfolio analytics system.
 * Each chart type has specific hover data requirements based on the metrics it displays.
 */

/**
 * Base interface with common fields shared across all chart hover states
 */
interface BaseHoverData {
  /** X coordinate in SVG space */
  x: number;
  /** Y coordinate in SVG space */
  y: number;
  /** Rendered width of the chart container in pixels */
  containerWidth?: number;
  /** Rendered height of the chart container in pixels */
  containerHeight?: number;
  /** Hover position on screen (relative to container) */
  screenX?: number;
  /** Hover vertical position on screen (relative to container) */
  screenY?: number;
  /** ISO date string of the data point */
  date: string;
  /** Chart type discriminator */
  chartType: string;
}

/**
 * Performance chart hover data
 * Shows portfolio value and benchmark comparison
 */
export interface PerformanceHoverData extends BaseHoverData {
  chartType: "performance";
  /** Portfolio value in USD */
  value: number;
  /** Benchmark value in USD */
  benchmark: number;
  /** DeFi portion of the portfolio value in USD */
  defiValue?: number;
  /** Wallet portion of the portfolio value in USD */
  walletValue?: number;
}

/**
 * Allocation chart hover data
 * Shows percentage breakdown across asset categories
 */
export interface AllocationHoverData extends BaseHoverData {
  chartType: "allocation";
  /** BTC allocation percentage (0-100) */
  btc: number;
  /** ETH allocation percentage (0-100) */
  eth: number;
  /** Stablecoin allocation percentage (0-100) */
  stablecoin: number;
  /** Altcoin allocation percentage (0-100) */
  altcoin: number;
}

/**
 * Drawdown chart hover data
 * Shows drawdown percentage and peak information
 */
export interface DrawdownHoverData extends BaseHoverData {
  chartType: "drawdown";
  /** Drawdown percentage (negative value) */
  drawdown: number;
  /** Date of the peak value before drawdown */
  peakDate: string;
  /** Days elapsed since peak */
  distanceFromPeak: number;
}

/**
 * Sharpe Ratio chart hover data
 * Shows risk-adjusted return metric with 5-level interpretation
 */
export interface SharpeHoverData extends BaseHoverData {
  chartType: "sharpe";
  /** Rolling Sharpe ratio value */
  sharpe: number;
  /** Human-readable interpretation of Sharpe value (5-level system) */
  interpretation: "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor";
}

/**
 * Volatility chart hover data
 * Shows 30-day rolling volatility with risk assessment
 */
export interface VolatilityHoverData extends BaseHoverData {
  chartType: "volatility";
  /** 30-day volatility percentage (annualized) */
  volatility: number;
  /** Risk level assessment based on volatility */
  riskLevel: "Low" | "Moderate" | "High" | "Very High";
}

/**
 * Underwater chart hover data
 * Shows underwater periods and recovery status
 */
export interface UnderwaterHoverData extends BaseHoverData {
  chartType: "underwater";
  /** Underwater percentage (negative value) */
  underwater: number;
  /** Whether this point marks a recovery to peak */
  isRecoveryPoint: boolean;
  /** Current recovery status */
  recoveryStatus: "Recovered" | "Recovering" | "Underwater";
}

/**
 * Discriminated union of all chart hover states
 * Use the chartType discriminator to narrow the type
 */
export type ChartHoverState =
  | PerformanceHoverData
  | AllocationHoverData
  | DrawdownHoverData
  | SharpeHoverData
  | VolatilityHoverData
  | UnderwaterHoverData;

/**
 * Helper type guard functions for type narrowing
 */
export function isPerformanceHover(
  state: ChartHoverState | null
): state is PerformanceHoverData {
  return state?.chartType === "performance";
}

export function isAllocationHover(
  state: ChartHoverState | null
): state is AllocationHoverData {
  return state?.chartType === "allocation";
}

export function isDrawdownHover(
  state: ChartHoverState | null
): state is DrawdownHoverData {
  return state?.chartType === "drawdown";
}

export function isSharpeHover(
  state: ChartHoverState | null
): state is SharpeHoverData {
  return state?.chartType === "sharpe";
}

export function isVolatilityHover(
  state: ChartHoverState | null
): state is VolatilityHoverData {
  return state?.chartType === "volatility";
}

export function isUnderwaterHover(
  state: ChartHoverState | null
): state is UnderwaterHoverData {
  return state?.chartType === "underwater";
}

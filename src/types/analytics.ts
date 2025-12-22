/**
 * Analytics Data Types
 *
 * Type definitions for the V22 Analytics tab data structures.
 * Used for transforming API responses into chart/metric display formats.
 */

import type {
    PortfolioDataPoint
} from "./domain/portfolio";

/**
 * Performance Chart Data
 *
 * SVG-ready data points for portfolio vs BTC benchmark visualization
 */
export interface PerformanceChartData {
  /** Normalized data points (x: 0-100, portfolio/btc: 0-100 inverted Y) */
  points: {
    x: number;
    portfolio: number;
    btc: number;
    date: string; // ISO date string for each point
    portfolioValue: number; // Original USD value for tooltip
  }[];
  /** ISO date string for chart start */
  startDate: string;
  /** ISO date string for chart end */
  endDate: string;
}

/**
 * Drawdown Chart Data
 *
 * Underwater chart showing portfolio drawdown over time
 */
export interface DrawdownChartData {
  /** Normalized data points (x: 0-100, value: drawdown percentage) */
  points: {
    x: number;
    value: number;
    date: string; // ISO date string for each point
  }[];
  /** Maximum drawdown percentage (negative number, e.g., -12.8) */
  maxDrawdown: number;
  /** ISO date string when max drawdown occurred */
  maxDrawdownDate: string;
}

/**
 * Individual Metric Display Data
 *
 * Structure for rendering a single metric card
 */
export interface MetricData {
  /** Formatted main value (e.g., "+124.5%", "2.45", "68%") */
  value: string;
  /** Contextual sub-value (e.g., "+2.4% vs BTC", "Top 5% of Pilots") */
  subValue: string;
  /** Visual trend indicator */
  trend: "up" | "down" | "neutral";
}

/**
 * All Key Metrics
 *
 * Complete set of analytics metrics for display
 */
export interface KeyMetrics {
  /** Time-Weighted Return (portfolio vs buy-and-hold) */
  timeWeightedReturn: MetricData;
  /** Maximum Drawdown percentage */
  maxDrawdown: MetricData;
  /** Sharpe Ratio (risk-adjusted returns) */
  sharpe: MetricData;
  /** Win Rate (% of positive return periods) */
  winRate: MetricData;
  /** Volatility (annualized standard deviation) */
  volatility: MetricData;
  /** Sortino Ratio (downside deviation, optional) */
  sortino?: MetricData;
  /** Beta (correlation with BTC, optional) */
  beta?: MetricData;
  /** Alpha (excess returns vs BTC, optional) */
  alpha?: MetricData;
}

/**
 * Monthly PnL Entry
 *
 * Single month's profit/loss percentage for heatmap
 */
export interface MonthlyPnL {
  /** Month abbreviation (e.g., "Jan", "Feb") */
  month: string;
  /** Four-digit year */
  year: number;
  /** Monthly return percentage (positive or negative) */
  value: number;
}

/**
 * Complete Analytics Data
 *
 * All data needed for Analytics tab rendering
 */
export interface AnalyticsData {
  /** Performance chart (portfolio vs BTC) */
  performanceChart: PerformanceChartData;
  /** Drawdown/underwater chart */
  drawdownChart: DrawdownChartData;
  /** All key metrics for metric cards */
  keyMetrics: KeyMetrics;
  /** Monthly PnL for heatmap (12-month grid) */
  monthlyPnL: MonthlyPnL[];
}

/**
 * Time Period Selection
 *
 * Available time windows for analytics data
 */
export interface AnalyticsTimePeriod {
  /** Unique key (e.g., "1M", "3M", "1Y") */
  key: string;
  /** Number of days to query */
  days: number;
  /** Display label */
  label: string;
}

/**
 * ==========================================
 * Portfolio Chart Analytics Types
 * ==========================================
 * Types originally from PortfolioChart component module
 * Migrated to centralized types for reuse across analytics hooks
 */

/**
 * Input point for allocation timeseries data transformation
 * Supports multiple field naming conventions from different API versions
 */
export interface AllocationTimeseriesInputPoint {
  date: string;
  category?: string;
  protocol?: string;
  percentage?: number;
  percentage_of_portfolio?: number;
  allocation_percentage?: number;
  category_value?: number;
  category_value_usd?: number;
  total_value?: number;
  total_portfolio_value_usd?: number;
}

/**
 * Extended portfolio data point with DeFi and Wallet breakdown
 * Used for stacked area chart visualization
 */
export interface PortfolioStackedDataPoint extends PortfolioDataPoint {
  /** DeFi protocols value in USD */
  defiValue: number;
  /** Wallet holdings value in USD */
  walletValue: number;
  /** Combined stacked total (should match value) */
  stackedTotalValue: number;
}

/**
 * Base interface for drawdown recovery metadata
 * Shared fields between DrawdownOverridePoint and DrawdownRecoveryData
 */
interface DrawdownRecoveryMetadata {
  /** Whether this point marks a recovery to new peak */
  isRecoveryPoint?: boolean;
  /** Number of days since last peak */
  daysFromPeak?: number;
  /** ISO date string of the peak this drawdown is measured from */
  peakDate?: string;
  /** Days taken to recover from underwater to new peak */
  recoveryDurationDays?: number;
  /** Deepest drawdown percentage during recovery cycle */
  recoveryDepth?: number;
  /** Whether this is historical data (before current period) */
  isHistoricalPeriod?: boolean;
}

/**
 * Drawdown data point with recovery annotations
 */
export interface DrawdownRecoveryData extends DrawdownRecoveryMetadata {
  /** ISO date string */
  date: string;
  /** Drawdown percentage (negative = underwater, 0 = at peak) */
  drawdown: number;
}

/**
 * Summary metrics for drawdown analysis
 */
export interface DrawdownRecoverySummary {
  /** Most severe drawdown percentage (most negative value) */
  maxDrawdown: number;
  /** Number of recovery points (returns to new peaks) */
  totalRecoveries: number;
  /** Average recovery duration in days (null if no recoveries) */
  averageRecoveryDays: number | null;
  /** Current drawdown percentage */
  currentDrawdown: number;
  /** Current portfolio status */
  currentStatus: "Underwater" | "At Peak";
  /** ISO date string of most recent peak */
  latestPeakDate?: string;
  /** Duration in days of most recent recovery */
  latestRecoveryDurationDays?: number;
}

// DrawdownOverridePoint, SharpeOverridePoint, VolatilityOverridePoint, 
// DailyYieldOverridePoint interfaces removed - deprecated with PortfolioChart (2025-12-22)

/**
 * Performance Metrics Types
 *
 * Shared types for consolidated performance metric components
 * (ROI, PnL, Yield) integrated into WalletPortfolio page
 */

import type { LandingPageResponse, YieldReturnsSummaryResponse } from "@/services/analyticsService";

/**
 * Common props for all performance metric variations
 */
export interface PerformanceMetricsProps {
  /** Portfolio ROI data from landing page API */
  portfolioROI?: LandingPageResponse["portfolio_roi"] | null | undefined;

  /** Yield summary data from dedicated yield API */
  yieldSummaryData?: YieldReturnsSummaryResponse | null | undefined;

  /** Is landing page data loading? */
  isLandingLoading?: boolean;

  /** Is yield data loading? */
  isYieldLoading?: boolean;

  /** Should show loading state? (from portfolio state helpers) */
  shouldShowLoading?: boolean;

  /** Portfolio change percentage for color coding */
  portfolioChangePercentage: number;

  /** Error message from portfolio state */
  errorMessage?: string | null | undefined;

  /** Optional className for container styling */
  className?: string;
}

/**
 * Metric type for hero card tab selection
 */
export type PerformanceMetricType = "roi" | "pnl" | "yield";

/**
 * Hero card specific props
 */
export interface HeroPerformanceCardProps extends PerformanceMetricsProps {
  /** Initial metric to display */
  defaultMetric?: PerformanceMetricType;

  /** Callback when metric selection changes */
  onMetricChange?: (metric: PerformanceMetricType) => void;
}

/**
 * Dashboard panel specific props
 */
export interface DashboardPerformancePanelProps extends PerformanceMetricsProps {
  /** Whether to show sparkline visualizations */
  showSparklines?: boolean;
}

/**
 * Compact metric display props (internal component)
 */
export interface CompactMetricProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  subtext?: string | undefined;
  colorClass?: string;
  isLoading?: boolean;
  badge?: string | undefined;
  badgeVariant?: "info" | "success" | "warning";
}

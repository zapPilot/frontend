/**
 * Performance Metrics Types
 *
 * Shared types for consolidated performance metric components
 * (ROI, PnL, Yield) integrated into WalletPortfolio page
 */

import type {
  LandingPageResponse,
  YieldReturnsSummaryResponse,
} from "@/services/analyticsService";

/**
 * Common props for performance metric components
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

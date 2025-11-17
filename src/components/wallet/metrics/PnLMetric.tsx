import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";
import { useMetricState } from "@/hooks/useMetricState";
import { getChangeColorClasses } from "@/lib/color-utils";
import { formatCurrency } from "@/lib/formatters";

import type { LandingPageResponse } from "../../../services/analyticsService";

interface PnLMetricProps {
  /** Portfolio ROI data containing estimated yearly PnL */
  portfolioROI?: LandingPageResponse["portfolio_roi"] | null | undefined;
  /** Is the landing page data loading? */
  isLoading?: boolean;
  /** Should show loading state? (from portfolio state helpers) */
  shouldShowLoading?: boolean;
  /** Portfolio change percentage for color coding */
  portfolioChangePercentage: number;
  /** User has error state */
  errorMessage?: string | null | undefined;
}

/**
 * Displays estimated yearly Profit and Loss (PnL) in USD.
 *
 * Extracted from WalletMetrics (lines 223-266) to create a focused,
 * single-responsibility component for PnL display.
 *
 * Features:
 * - Color-coded based on portfolio performance
 * - Smart currency formatting with precision
 * - "est." badge to indicate estimation
 *
 * @example
 * ```tsx
 * <PnLMetric
 *   portfolioROI={data?.portfolio_roi}
 *   portfolioChangePercentage={5.2}
 *   isLoading={false}
 * />
 * ```
 */
export function PnLMetric({
  portfolioROI,
  isLoading,
  shouldShowLoading,
  portfolioChangePercentage,
  errorMessage,
}: PnLMetricProps) {
  // Use estimated_yearly_pnl_usd directly from API
  const estimatedYearlyPnL = portfolioROI?.estimated_yearly_pnl_usd;

  const metricState = useMetricState({
    isLoading,
    shouldShowLoading,
    value: estimatedYearlyPnL,
  });

  // Loading state
  if (metricState.shouldRenderSkeleton) {
    return (
      <div>
        <p className="text-sm text-gray-400 mb-1">Estimated Yearly PnL</p>
        <WalletMetricsSkeleton
          showValue={true}
          showPercentage={false}
          className="w-24"
        />
      </div>
    );
  }

  // Error state - show welcome for new users (handled in parent)
  if (errorMessage === "USER_NOT_FOUND") {
    return null;
  }

  // No data available
  if (!estimatedYearlyPnL && estimatedYearlyPnL !== 0) {
    return (
      <div>
        <p className="text-sm text-gray-400 mb-1">Estimated Yearly PnL</p>
        <div className="flex items-center space-x-2 text-gray-400">
          <p className="text-xl font-semibold">No data available</p>
        </div>
      </div>
    );
  }

  // Normal display with data
  return (
    <div>
      <p className="text-sm text-gray-400 mb-1">Estimated Yearly PnL</p>
      <div
        className={`flex items-center space-x-2 ${getChangeColorClasses(portfolioChangePercentage)}`}
      >
        <p className="text-xl font-semibold">
          {formatCurrency(estimatedYearlyPnL, {
            smartPrecision: true,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <span className="text-xs text-purple-400 font-medium bg-purple-900/20 px-1.5 py-0.5 rounded-full">
          est.
        </span>
      </div>
    </div>
  );
}

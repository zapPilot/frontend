import React from "react";

import { usePortfolioStateHelpers } from "../../hooks/usePortfolioState";
import { useResolvedBalanceVisibility } from "../../hooks/useResolvedBalanceVisibility";
import type {
  LandingPageResponse,
  YieldReturnsSummaryResponse,
} from "../../services/analyticsService";
import { PortfolioState } from "../../types/portfolioState";
import { BalanceMetric, PnLMetric, ROIMetric, YieldMetric } from "./metrics";
import { WelcomeNewUser } from "./WelcomeNewUser";

interface WalletMetricsProps {
  portfolioState: PortfolioState;
  balanceHidden?: boolean;
  portfolioChangePercentage: number;
  userId?: string | null;
  // PROGRESSIVE LOADING: Split data sources for independent metric rendering
  landingPageData?: LandingPageResponse | null | undefined;
  yieldSummaryData?: YieldReturnsSummaryResponse | null | undefined;
  // Independent loading states for progressive disclosure
  isLandingLoading?: boolean;
  isYieldLoading?: boolean;
}

/**
 * Orchestrates wallet metrics display with progressive loading.
 * Each metric renders independently based on its own data availability.
 *
 * Refactored from 501-line monolithic component to clean orchestrator pattern.
 * Individual metrics are now in /metrics/ subdirectory for better maintainability.
 *
 * @see BalanceMetric - Total portfolio balance
 * @see ROIMetric - Estimated yearly ROI with period breakdown
 * @see PnLMetric - Estimated yearly profit/loss
 * @see YieldMetric - Average daily yield with confidence indicators
 */
export const WalletMetrics = React.memo<WalletMetricsProps>(
  ({
    portfolioState,
    balanceHidden,
    portfolioChangePercentage,
    landingPageData,
    yieldSummaryData,
    isLandingLoading = false,
    isYieldLoading = false,
  }) => {
    const resolvedHidden = useResolvedBalanceVisibility(balanceHidden);

    // Use portfolio state helpers for consistent logic
    const {
      shouldShowLoading,
      shouldShowNoDataMessage,
      shouldShowError,
      getDisplayTotalValue,
    } = usePortfolioStateHelpers(portfolioState);

    // Show welcome message for new users
    if (portfolioState.errorMessage === "USER_NOT_FOUND") {
      return <WelcomeNewUser />;
    }

    // Some older flows still inject yield_summary via landingPageData.
    // Fall back to that structure when the dedicated yield query hasn't resolved yet
    // so legacy screens/tests keep working while progressive loading is rolled out.
    const resolvedYieldSummary =
      yieldSummaryData ?? landingPageData?.yield_summary ?? null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <BalanceMetric
          totalNetUsd={landingPageData?.total_net_usd ?? null}
          isLoading={isLandingLoading}
          shouldShowLoading={shouldShowLoading}
          balanceHidden={resolvedHidden}
          shouldShowError={shouldShowError}
          errorMessage={portfolioState.errorMessage ?? null}
          shouldShowNoDataMessage={shouldShowNoDataMessage}
          getDisplayTotalValue={getDisplayTotalValue}
        />

        <ROIMetric
          portfolioROI={landingPageData?.portfolio_roi}
          isLoading={isLandingLoading}
          shouldShowLoading={shouldShowLoading}
          portfolioChangePercentage={portfolioChangePercentage}
          isConnected={portfolioState.isConnected}
          errorMessage={portfolioState.errorMessage}
        />

        <PnLMetric
          portfolioROI={landingPageData?.portfolio_roi}
          isLoading={isLandingLoading}
          shouldShowLoading={shouldShowLoading}
          portfolioChangePercentage={portfolioChangePercentage}
          errorMessage={portfolioState.errorMessage}
        />

        <YieldMetric
          yieldSummaryData={resolvedYieldSummary}
          isYieldLoading={isYieldLoading}
          errorMessage={portfolioState.errorMessage}
        />
      </div>
    );
  }
);

WalletMetrics.displayName = "WalletMetrics";

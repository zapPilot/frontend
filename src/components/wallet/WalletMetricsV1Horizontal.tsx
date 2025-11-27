"use client";

import React from "react";

import type { MarketSentimentData } from "@/services/sentimentService";

import { usePortfolioStateHelpers } from "../../hooks/usePortfolioState";
import { useResolvedBalanceVisibility } from "../../hooks/useResolvedBalanceVisibility";
import type {
  LandingPageResponse,
  YieldReturnsSummaryResponse,
} from "../../services/analyticsService";
import { PortfolioState } from "../../types/portfolioState";
import { WelcomeNewUser } from "./WelcomeNewUser";
import { BalanceMetricV1 } from "./metrics/BalanceMetricV1";
import { ConsolidatedMetricV1Compact } from "./metrics/consolidated/ConsolidatedMetricV1Compact";
import { MarketSentimentMetricV1 } from "./metrics/MarketSentimentMetricV1";

interface WalletMetricsV1HorizontalProps {
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
  sentimentData?: MarketSentimentData | null;
  isSentimentLoading?: boolean;
  sentimentError?: Error | null;
}

/**
 * Variation 1: Compact Horizontal Layout
 *
 * Orchestrates wallet metrics display with 30-35% height reduction.
 *
 * Key differences from original:
 * - Uses V1 compact components with p-4 padding instead of p-6
 * - Smaller font sizes (text-xl/2xl instead of text-3xl/4xl)
 * - Tighter spacing throughout
 * - Maintains all functionality and progressive loading
 *
 * Displays portfolio metrics using a consolidated layout with:
 * - BalanceMetricV1 for total portfolio balance
 * - ConsolidatedMetricV1Compact for ROI, PnL, and Yield in a single card
 * - MarketSentimentMetricV1 for market sentiment indicators
 *
 * @example
 * ```tsx
 * <WalletMetricsV1Horizontal
 *   portfolioState={portfolioState}
 *   landingPageData={landingData}
 *   yieldSummaryData={yieldData}
 *   sentimentData={sentimentData}
 * />
 * ```
 */
export const WalletMetricsV1Horizontal = React.memo<WalletMetricsV1HorizontalProps>(
  ({
    portfolioState,
    balanceHidden,
    portfolioChangePercentage,
    landingPageData,
    yieldSummaryData,
    isLandingLoading = false,
    isYieldLoading = false,
    sentimentData,
    isSentimentLoading = false,
    sentimentError = null,
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

    // Performance metrics props (shared across variations)
    const performanceProps = {
      portfolioROI: landingPageData?.portfolio_roi,
      yieldSummaryData: resolvedYieldSummary,
      isLandingLoading,
      isYieldLoading,
      shouldShowLoading,
      portfolioChangePercentage,
      errorMessage: portfolioState.errorMessage,
    };

    // Calculate pool details summary stats
    const poolDetails = landingPageData?.pool_details ?? [];
    const totalPositions = poolDetails.length;
    const protocolsCount =
      poolDetails.length > 0
        ? new Set(poolDetails.map(p => p.protocol.toLowerCase())).size
        : 0;
    const chainsCount =
      poolDetails.length > 0
        ? new Set(poolDetails.map(p => p.chain.toLowerCase())).size
        : 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <BalanceMetricV1
            totalNetUsd={landingPageData?.total_net_usd ?? null}
            isLoading={isLandingLoading}
            shouldShowLoading={shouldShowLoading}
            balanceHidden={resolvedHidden}
            shouldShowError={shouldShowError}
            errorMessage={portfolioState.errorMessage ?? null}
            shouldShowNoDataMessage={shouldShowNoDataMessage}
            getDisplayTotalValue={getDisplayTotalValue}
            poolDetails={poolDetails}
            totalPositions={totalPositions}
            protocolsCount={protocolsCount}
            chainsCount={chainsCount}
          />
        </div>
        <div>
          <ConsolidatedMetricV1Compact {...performanceProps} />
        </div>
        <div>
          <MarketSentimentMetricV1
            sentiment={sentimentData ?? null}
            isLoading={isSentimentLoading}
            error={sentimentError}
          />
        </div>
      </div>
    );
  }
);

WalletMetricsV1Horizontal.displayName = "WalletMetricsV1Horizontal";

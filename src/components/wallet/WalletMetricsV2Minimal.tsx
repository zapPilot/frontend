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
import { BalanceMetricV2 } from "./metrics/BalanceMetricV2";
import { ConsolidatedMetricV2Minimal } from "./metrics/consolidated/ConsolidatedMetricV2Minimal";
import { MarketSentimentMetricV2 } from "./metrics/MarketSentimentMetricV2";

interface WalletMetricsV2MinimalProps {
  portfolioState: PortfolioState;
  balanceHidden?: boolean;
  portfolioChangePercentage: number;
  userId?: string | null;
  landingPageData?: LandingPageResponse | null | undefined;
  yieldSummaryData?: YieldReturnsSummaryResponse | null | undefined;
  isLandingLoading?: boolean;
  isYieldLoading?: boolean;
  sentimentData?: MarketSentimentData | null;
  isSentimentLoading?: boolean;
  sentimentError?: Error | null;
}

/**
 * Variation 2: Minimal Clean Layout
 *
 * Orchestrates wallet metrics display with 40-50% height reduction (most aggressive).
 *
 * Key differences from original:
 * - Uses V2 minimal components with p-3 padding instead of p-6
 * - Smallest font sizes (text-base/lg instead of text-3xl/4xl)
 * - Ultra-tight spacing throughout
 * - Single-line quote with line-clamp-1
 * - Maintains core functionality and progressive loading
 *
 * @example
 * ```tsx
 * <WalletMetricsV2Minimal
 *   portfolioState={portfolioState}
 *   landingPageData={landingData}
 *   yieldSummaryData={yieldData}
 *   sentimentData={sentimentData}
 * />
 * ```
 */
export const WalletMetricsV2Minimal = React.memo<WalletMetricsV2MinimalProps>(
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

    const {
      shouldShowLoading,
      shouldShowNoDataMessage,
      shouldShowError,
      getDisplayTotalValue,
    } = usePortfolioStateHelpers(portfolioState);

    if (portfolioState.errorMessage === "USER_NOT_FOUND") {
      return <WelcomeNewUser />;
    }

    const resolvedYieldSummary =
      yieldSummaryData ?? landingPageData?.yield_summary ?? null;

    const performanceProps = {
      portfolioROI: landingPageData?.portfolio_roi,
      yieldSummaryData: resolvedYieldSummary,
      isLandingLoading,
      isYieldLoading,
      shouldShowLoading,
      portfolioChangePercentage,
      errorMessage: portfolioState.errorMessage,
    };

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
          <BalanceMetricV2
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
          <ConsolidatedMetricV2Minimal {...performanceProps} />
        </div>
        <div>
          <MarketSentimentMetricV2
            sentiment={sentimentData ?? null}
            isLoading={isSentimentLoading}
            error={sentimentError}
          />
        </div>
      </div>
    );
  }
);

WalletMetricsV2Minimal.displayName = "WalletMetricsV2Minimal";

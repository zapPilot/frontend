"use client";

import React from "react";

import type { MarketSentimentData } from "@/services/sentimentService";
import { PortfolioState } from "@/types/ui/portfolioState";

import { usePortfolioStateHelpers } from "../../hooks/usePortfolioState";
import { useResolvedBalanceVisibility } from "../../hooks/useResolvedBalanceVisibility";
import type {
  LandingPageResponse,
  YieldReturnsSummaryResponse,
} from "../../services/analyticsService";
import { BalanceMetric } from "./metrics/BalanceMetric";
import { ConsolidatedMetric } from "./metrics/consolidated/ConsolidatedMetric";
import { MarketSentimentMetric } from "./metrics/MarketSentimentMetric";
import { WelcomeNewUser } from "./WelcomeNewUser";

interface WalletMetricsModernProps {
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
 * Variation 3: Creative Modern Layout
 *
 * Orchestrates wallet metrics display with 35-40% height reduction and modern styling.
 *
 * Key differences from original:
 * - Uses V3 modern components with p-4 padding and gradient accents
 * - Left gradient border accents (blue-purple for balance, green for ROI, sentiment-colored for sentiment)
 * - Badge-style labels with gradient backgrounds
 * - Grid layout for performance metrics
 * - Styled quote containers
 * - Moderate font sizes (text-xl/2xl instead of text-3xl/4xl)
 * - Maintains all functionality and progressive loading
 *
 * @example
 * ```tsx
 * <WalletMetricsV3Modern
 *   portfolioState={portfolioState}
 *   landingPageData={landingData}
 *   yieldSummaryData={yieldData}
 *   sentimentData={sentimentData}
 * />
 * ```
 */
export const WalletMetricsModern = React.memo<WalletMetricsModernProps>(
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
          <BalanceMetric
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
          <ConsolidatedMetric {...performanceProps} />
        </div>
        <div>
          <MarketSentimentMetric
            sentiment={sentimentData ?? null}
            isLoading={isSentimentLoading}
            error={sentimentError}
          />
        </div>
      </div>
    );
  }
);

WalletMetricsModern.displayName = "WalletMetricsModern";

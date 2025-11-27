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
import { BalanceMetric } from "./metrics";
import { ConsolidatedMetricV1 } from "./metrics/consolidated/ConsolidatedMetricV1";
import { MarketSentimentMetric } from "./metrics/MarketSentimentMetric";
import { WalletMetricsV1Horizontal } from "./WalletMetricsV1Horizontal";
import { WalletMetricsV2Minimal } from "./WalletMetricsV2Minimal";
import { WalletMetricsV3Modern } from "./WalletMetricsV3Modern";
import { WelcomeNewUser } from "./WelcomeNewUser";

/**
 * LAYOUT VARIANT SWITCHER
 *
 * Change this constant to switch between layout variations:
 * - 0: Original layout (default, tallest)
 * - 1: V1 Compact Horizontal (30-35% height reduction, recommended)
 * - 2: V2 Minimal Clean (40-50% height reduction, most compact)
 * - 3: V3 Creative Modern (35-40% height reduction, gradient accents)
 *
 * After choosing your favorite, delete the unwanted variation files
 * and update this component to use the chosen variation directly.
 */
const LAYOUT_VARIANT: number = 3; // 👈 Change this to switch layouts

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
  sentimentData?: MarketSentimentData | null;
  isSentimentLoading?: boolean;
  sentimentError?: Error | null;
}

/**
 * Orchestrates wallet metrics display with progressive loading.
 * Each metric renders independently based on its own data availability.
 *
 * Displays portfolio metrics using a consolidated layout with:
 * - BalanceMetric for total portfolio balance
 * - ConsolidatedMetricV1 for ROI, PnL, and Yield in a single card
 * - MarketSentimentMetric for market sentiment indicators
 */

export const WalletMetrics = React.memo<WalletMetricsProps>((props) => {
  // Delegate to the selected layout variant
  if (LAYOUT_VARIANT === 1) {
    return <WalletMetricsV1Horizontal {...props} />;
  }

  if (LAYOUT_VARIANT === 2) {
    return <WalletMetricsV2Minimal {...props} />;
  }

  if (LAYOUT_VARIANT === 3) {
    return <WalletMetricsV3Modern {...props} />;
  }

  // LAYOUT_VARIANT === 0 or fallback: Original layout
  const {
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
  } = props;

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
        <ConsolidatedMetricV1 {...performanceProps} />
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
});

WalletMetrics.displayName = "WalletMetrics";

"use client";

import React, { useState, useEffect } from "react";

import type { MarketSentimentData } from "@/services/sentimentService";

import { usePortfolioStateHelpers } from "../../hooks/usePortfolioState";
import { useResolvedBalanceVisibility } from "../../hooks/useResolvedBalanceVisibility";
import type {
  LandingPageResponse,
  YieldReturnsSummaryResponse,
} from "../../services/analyticsService";
import { PortfolioState } from "../../types/portfolioState";
import { BalanceMetric, PnLMetric, ROIMetric, YieldMetric } from "./metrics";
import { MarketSentimentMetric } from "./metrics/MarketSentimentMetric";
import { WelcomeNewUser } from "./WelcomeNewUser";
import {
  HorizontalPerformanceBar,
  HeroPerformanceCard,
  DashboardPerformancePanel,
} from "./metrics/performance";

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
 * Refactored from 501-line monolithic component to clean orchestrator pattern.
 * Individual metrics are now in /metrics/ subdirectory for better maintainability.
 *
 * @see BalanceMetric - Total portfolio balance
 * @see ROIMetric - Estimated yearly ROI with period breakdown
 * @see PnLMetric - Estimated yearly profit/loss
 * @see YieldMetric - Average daily yield with confidence indicators
 */
type MetricVariation = "original" | "horizontal" | "hero" | "dashboard";

export const WalletMetrics = React.memo<WalletMetricsProps>(
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

    // Variation switcher state
    const [variation, setVariation] = useState<MetricVariation>("original");
    const [showSwitcher, setShowSwitcher] = useState(false);

    // Load saved variation from localStorage
    useEffect(() => {
      const saved = localStorage.getItem("wallet_metrics_variation");
      if (saved && (saved === "original" || saved === "horizontal" || saved === "hero" || saved === "dashboard")) {
        setVariation(saved);
      }

      // Show switcher in development or if explicitly enabled
      const enableSwitcher = localStorage.getItem("enable_metrics_switcher") === "true";
      setShowSwitcher(process.env.NODE_ENV === "development" || enableSwitcher);
    }, []);

    // Handle variation change
    const handleVariationChange = (newVariation: MetricVariation) => {
      setVariation(newVariation);
      localStorage.setItem("wallet_metrics_variation", newVariation);
    };

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

    return (
      <>
        {/* Variation Switcher (Development Mode) */}
        {showSwitcher && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <p className="text-xs text-yellow-400 mb-2 font-medium">
              🔧 Development: Metric Variations
            </p>
            <div className="flex flex-wrap gap-2">
              {(["original", "horizontal", "hero", "dashboard"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => handleVariationChange(v)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    variation === v
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {v === "original" && "Original (5-col)"}
                  {v === "horizontal" && "Horizontal Bar"}
                  {v === "hero" && "Hero Card"}
                  {v === "dashboard" && "Dashboard Panel"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Render based on selected variation */}
        {variation === "original" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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

            <MarketSentimentMetric
              sentiment={sentimentData ?? null}
              isLoading={isSentimentLoading}
              error={sentimentError}
            />
          </div>
        )}

        {variation === "horizontal" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

            <HorizontalPerformanceBar {...performanceProps} />

            <MarketSentimentMetric
              sentiment={sentimentData ?? null}
              isLoading={isSentimentLoading}
              error={sentimentError}
            />
          </div>
        )}

        {variation === "hero" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

            <HeroPerformanceCard {...performanceProps} defaultMetric="roi" />
          </div>
        )}

        {variation === "dashboard" && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <MarketSentimentMetric
                sentiment={sentimentData ?? null}
                isLoading={isSentimentLoading}
                error={sentimentError}
              />
            </div>

            <DashboardPerformancePanel {...performanceProps} showSparklines={false} />
          </div>
        )}
      </>
    );
  }
);

WalletMetrics.displayName = "WalletMetrics";

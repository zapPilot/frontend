"use client";

import React from "react";

import type { MarketSentimentData } from "@/services/sentimentService";

import type {
  LandingPageResponse,
  YieldReturnsSummaryResponse,
} from "../../services/analyticsService";
import { PortfolioState } from "../../types/portfolioState";
import { WalletMetricsModern } from "./WalletMetricsModern";

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
 * Uses the modern layout with gradient accents and optimized vertical spacing:
 * - BalanceMetricModern for total portfolio balance
 * - ConsolidatedMetricModern for ROI, PnL, and Yield in a single card
 * - MarketSentimentMetricModern for market sentiment indicators
 */
export const WalletMetrics = React.memo<WalletMetricsProps>(props => {
  return <WalletMetricsModern {...props} />;
});

WalletMetrics.displayName = "WalletMetrics";

"use client";

import { useCallback, useMemo, useState } from "react";

import { useUser } from "@/contexts/UserContext";
import { useLandingPageData, useYieldSummaryData } from "@/hooks/queries/usePortfolioQuery";
import { usePortfolioState } from "@/hooks/usePortfolioState";
import { useWalletPortfolioTransform } from "@/hooks/useWalletPortfolioTransform";
import type {
  LandingPageResponse,
  YieldReturnsSummaryResponse,
} from "@/services/analyticsService";
import {
  type MarketSentimentData,
  useSentimentData,
} from "@/services/sentimentService";
import type { PortfolioAllocationSplit } from "@/types/portfolio";

const DEFAULT_TARGET_ALLOCATION = 50;

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 100);
}

/**
 * Extract allocation percentages from portfolio data.
 * Uses pre-calculated percentage_of_portfolio from backend.
 */
function calculateAllocation(
  landingPageData: LandingPageResponse | undefined
): PortfolioAllocationSplit | null {
  if (!landingPageData) {
    return null;
  }

  const allocation = landingPageData.portfolio_allocation;
  if (!allocation) {
    return null;
  }

  // Use pre-calculated percentages from backend
  const stablePercentage = allocation.stablecoins.percentage_of_portfolio ?? 0;
  const cryptoPercentage =
    (allocation.btc.percentage_of_portfolio ?? 0) +
    (allocation.eth.percentage_of_portfolio ?? 0) +
    (allocation.others.percentage_of_portfolio ?? 0);

  return {
    stable: clampPercentage(stablePercentage),
    crypto: clampPercentage(cryptoPercentage),
    target: DEFAULT_TARGET_ALLOCATION,
  };
}

interface UseWalletPortfolioStateParams {
  urlUserId?: string;
  onOptimizeClick?: (() => void) | undefined;
  onZapInClick?: (() => void) | undefined;
  onZapOutClick?: (() => void) | undefined;
  onCategoryClick?: (categoryId: string) => void;
  onToggleBalance?: () => void;
  isOwnBundle?: boolean | undefined;
  bundleUserName?: string | undefined;
  bundleUrl?: string;
}

export function usePortfolioViewToggles(
  onToggleBalance?: (() => void) | undefined,
  onCategoryClick?: (categoryId: string) => void
) {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const toggleBalanceVisibility = useCallback(() => {
    setBalanceHidden(prev => !prev);
    onToggleBalance?.();
  }, [onToggleBalance]);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const toggleCategoryExpansion = useCallback(
    (categoryId: string) => {
      setExpandedCategory(prev => (prev === categoryId ? null : categoryId));
      onCategoryClick?.(categoryId);
    },
    [onCategoryClick]
  );

  return {
    balanceHidden,
    toggleBalanceVisibility,
    expandedCategory,
    toggleCategoryExpansion,
  } as const;
}

export interface WalletPortfolioViewModel {
  // Identity
  resolvedUserId: string | null;
  isVisitorMode: boolean;
  // Data
  landingPageData: LandingPageResponse | undefined;
  yieldSummaryData: YieldReturnsSummaryResponse | null | undefined;
  pieChartData: ReturnType<typeof useWalletPortfolioTransform>["pieChartData"];
  categorySummaries: ReturnType<
    typeof useWalletPortfolioTransform
  >["categorySummaries"];
  debtCategorySummaries: ReturnType<
    typeof useWalletPortfolioTransform
  >["debtCategorySummaries"];
  portfolioMetrics: ReturnType<
    typeof useWalletPortfolioTransform
  >["portfolioMetrics"];
  leverageMetrics: ReturnType<
    typeof useWalletPortfolioTransform
  >["leverageMetrics"];
  sentimentData: MarketSentimentData | null;
  allocation: PortfolioAllocationSplit | null;
  // Aggregated portfolio state
  portfolioState: ReturnType<typeof usePortfolioState>;
  // Progressive loading states
  isLandingLoading: boolean;
  isYieldLoading: boolean;
  isSentimentLoading: boolean;
  sentimentError: Error | null;
  // Local portfolio view toggles
  balanceHidden: boolean;
  toggleBalanceVisibility: () => void;
  expandedCategory: string | null;
  toggleCategoryExpansion: (categoryId: string) => void;
  // Actions (effective with visitor gating applied)
  onOptimizeClick?: () => void;
  onZapInClick?: () => void;
  onZapOutClick?: () => void;
  onCategoryClick?: (categoryId: string) => void;
  // Bundle display context (pass-through)
  isOwnBundle?: boolean | undefined;
  bundleUserName?: string | undefined;
  bundleUrl?: string;
  // UI/Modal
  isWalletManagerOpen: boolean;
  openWalletManager: () => void;
  closeWalletManager: () => void;
  // Requery
  onRetry: () => Promise<unknown>;
}

export function useWalletPortfolioState(
  params: UseWalletPortfolioStateParams = {}
): WalletPortfolioViewModel {
  const {
    urlUserId,
    onOptimizeClick,
    onZapInClick,
    onZapOutClick,
    onCategoryClick,
    onToggleBalance,
    isOwnBundle,
    bundleUserName,
    bundleUrl,
  } = params;

  // User context
  const { userInfo, isConnected } = useUser();

  // Resolve userId
  const resolvedUserId = urlUserId || userInfo?.userId || null;

  // Visitor mode: not connected or viewing someone else's portfolio
  const isVisitorMode =
    !isConnected || (!!urlUserId && urlUserId !== userInfo?.userId);

  // PERFORMANCE OPTIMIZATION: Parallel data queries for progressive loading
  // Landing page data (Balance, ROI, PnL) loads first (~300ms)
  const landingPageQuery = useLandingPageData(resolvedUserId);
  const landingPageData = landingPageQuery.data;

  // Yield summary data loads independently (~1500ms) without blocking core metrics
  const yieldSummaryQuery = useYieldSummaryData(resolvedUserId);
  const yieldSummaryData = yieldSummaryQuery.data;

  const sentimentQuery = useSentimentData();
  const sentimentData = sentimentQuery.data ?? null;
  // Show loading state when query is pending, even during retry attempts
  // This prevents showing "No data" while the API is still being fetched
  const isSentimentLoading =
    sentimentQuery.isLoading ||
    sentimentQuery.isFetching ||
    sentimentQuery.isRefetching;
  const sentimentError = sentimentQuery.error;

  // Derived portfolio data
  const {
    pieChartData,
    categorySummaries,
    debtCategorySummaries,
    portfolioMetrics,
    leverageMetrics,
    hasZeroData,
  } = useWalletPortfolioTransform(landingPageData);

  const allocation = useMemo(
    () => calculateAllocation(landingPageData),
    [landingPageData]
  );

  // Aggregated UI state for portfolio
  const portfolioState = usePortfolioState({
    isConnected,
    isLoading: landingPageQuery.isLoading,
    isRetrying: landingPageQuery.isRefetching,
    error: (landingPageQuery.error as Error | null)?.message || null,
    landingPageData: landingPageData ?? null,
    hasZeroData,
  });

  // Local portfolio view toggles
  const {
    balanceHidden,
    toggleBalanceVisibility,
    expandedCategory,
    toggleCategoryExpansion,
  } = usePortfolioViewToggles(onToggleBalance, onCategoryClick);

  // Wallet manager modal controls (inlined from useWalletModal)
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);
  const openWalletManager = () => setIsWalletManagerOpen(true);
  const closeWalletManager = () => setIsWalletManagerOpen(false);

  // Gate action handlers when in visitor mode
  const gatedOnOptimize = !isVisitorMode ? onOptimizeClick : undefined;
  const gatedOnZapIn = !isVisitorMode ? onZapInClick : undefined;
  const gatedOnZapOut = !isVisitorMode ? onZapOutClick : undefined;

  return {
    resolvedUserId,
    isVisitorMode,
    landingPageData,
    yieldSummaryData,
    pieChartData,
    categorySummaries,
    debtCategorySummaries,
    portfolioMetrics,
    leverageMetrics,
    sentimentData,
    allocation,
    portfolioState,
    isLandingLoading: landingPageQuery.isLoading,
    isYieldLoading: yieldSummaryQuery.isLoading,
    isSentimentLoading,
    sentimentError: sentimentError ?? null,
    balanceHidden,
    toggleBalanceVisibility,
    expandedCategory,
    toggleCategoryExpansion,
    ...(gatedOnOptimize ? { onOptimizeClick: gatedOnOptimize } : {}),
    ...(gatedOnZapIn ? { onZapInClick: gatedOnZapIn } : {}),
    ...(gatedOnZapOut ? { onZapOutClick: gatedOnZapOut } : {}),
    ...(onCategoryClick ? { onCategoryClick } : {}),
    ...(typeof isOwnBundle !== "undefined" ? { isOwnBundle } : {}),
    ...(bundleUserName ? { bundleUserName } : {}),
    ...(bundleUrl ? { bundleUrl } : {}),
    isWalletManagerOpen,
    openWalletManager,
    closeWalletManager,
    onRetry: landingPageQuery.refetch,
  };
}

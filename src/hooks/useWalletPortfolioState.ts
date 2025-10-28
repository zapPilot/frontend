"use client";

import { useCallback, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useLandingPageData } from "@/hooks/queries/usePortfolioQuery";
import { usePortfolioState } from "@/hooks/usePortfolioState";
import { useWalletPortfolioTransform } from "@/hooks/useWalletPortfolioTransform";
import type { LandingPageResponse } from "@/services/analyticsService";
import { usePortfolio } from "./usePortfolio";

export interface UseWalletPortfolioStateParams {
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
  // Aggregated portfolio state
  portfolioState: ReturnType<typeof usePortfolioState>;
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
  onRetry: () => void;
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

  // Data query
  const landingPageQuery = useLandingPageData(resolvedUserId);
  const landingPageData = landingPageQuery.data;

  // Derived portfolio data
  const {
    pieChartData,
    categorySummaries,
    debtCategorySummaries,
    portfolioMetrics,
    hasZeroData,
  } = useWalletPortfolioTransform(landingPageData);

  // Aggregated UI state for portfolio
  const portfolioState = usePortfolioState({
    isConnected,
    isLoading: landingPageQuery.isLoading,
    isRetrying: landingPageQuery.isRefetching,
    error: (landingPageQuery.error as Error | null)?.message || null,
    landingPageData: landingPageData ?? null,
    hasZeroData,
  });

  // View toggles consolidated from legacy usePortfolio hook
  const {
    balanceHidden,
    toggleBalanceVisibility: legacyToggleBalanceVisibility = () => {},
    expandedCategory,
    toggleCategoryExpansion: legacyToggleCategoryExpansion = () => {},
  } = usePortfolio([]);

  const toggleBalanceVisibility = useCallback(() => {
    legacyToggleBalanceVisibility();
    onToggleBalance?.();
  }, [legacyToggleBalanceVisibility, onToggleBalance]);

  const toggleCategoryExpansion = useCallback(
    (categoryId: string) => {
      legacyToggleCategoryExpansion(categoryId);
      onCategoryClick?.(categoryId);
    },
    [legacyToggleCategoryExpansion, onCategoryClick]
  );

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
    pieChartData,
    categorySummaries,
    debtCategorySummaries,
    portfolioMetrics,
    portfolioState,
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

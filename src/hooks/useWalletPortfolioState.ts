"use client";

import { useUser } from "@/contexts/UserContext";
import { useLandingPageData } from "@/hooks/queries/usePortfolioQuery";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { usePortfolioState } from "@/hooks/usePortfolioState";
import { useWalletModal } from "@/hooks/useWalletModal";
import type { LandingPageResponse } from "@/services/analyticsService";
import { usePortfolio } from "@/hooks/usePortfolio";

export interface UseWalletPortfolioStateParams {
  urlUserId?: string;
  onOptimizeClick?: (() => void) | undefined;
  onZapInClick?: (() => void) | undefined;
  onZapOutClick?: (() => void) | undefined;
  onCategoryClick?: (categoryId: string) => void;
  isOwnBundle?: boolean | undefined;
  bundleUserName?: string | undefined;
  bundleUrl?: string;
}

export interface WalletPortfolioViewModel {
  // Identity
  resolvedUserId: string | null;
  isVisitorMode: boolean;
  // Data
  landingPageData: LandingPageResponse | undefined;
  pieChartData: ReturnType<typeof usePortfolioData>["pieChartData"];
  categorySummaries: ReturnType<typeof usePortfolioData>["categorySummaries"];
  debtCategorySummaries: ReturnType<
    typeof usePortfolioData
  >["debtCategorySummaries"];
  portfolioMetrics: ReturnType<typeof usePortfolioData>["portfolioMetrics"];
  // Aggregated portfolio state
  portfolioState: ReturnType<typeof usePortfolioState>;
  // Actions (effective with visitor gating applied)
  onOptimizeClick?: () => void;
  onZapInClick?: () => void;
  onZapOutClick?: () => void;
  onCategoryClick?: (categoryId: string) => void;
  // Optional balance toggle passthrough for compatibility
  onToggleBalance?: () => void;
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
  } = usePortfolioData(landingPageData);

  // Aggregated UI state for portfolio
  const portfolioState = usePortfolioState({
    isConnected,
    isLoading: landingPageQuery.isLoading,
    isRetrying: landingPageQuery.isRefetching,
    error: landingPageQuery.error?.message || null,
    landingPageData: landingPageData ?? null,
    hasZeroData,
  });

  // Wallet manager modal controls
  const {
    isOpen: isWalletManagerOpen,
    openModal: openWalletManager,
    closeModal: closeWalletManager,
  } = useWalletModal();

  // Balance toggle (compatibility passthrough for tests and existing mocks)
  const { toggleBalanceVisibility } = usePortfolio([]);

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
    ...(gatedOnOptimize ? { onOptimizeClick: gatedOnOptimize } : {}),
    ...(gatedOnZapIn ? { onZapInClick: gatedOnZapIn } : {}),
    ...(gatedOnZapOut ? { onZapOutClick: gatedOnZapOut } : {}),
    ...(onCategoryClick ? { onCategoryClick } : {}),
    onToggleBalance: toggleBalanceVisibility,
    ...(typeof isOwnBundle !== "undefined" ? { isOwnBundle } : {}),
    ...(bundleUserName ? { bundleUserName } : {}),
    ...(bundleUrl ? { bundleUrl } : {}),
    isWalletManagerOpen,
    openWalletManager,
    closeWalletManager,
    onRetry: landingPageQuery.refetch,
  };
}

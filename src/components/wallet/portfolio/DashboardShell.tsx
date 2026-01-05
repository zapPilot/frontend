"use client";

import type { ReactNode } from "react";

import { createEmptyPortfolioState } from "@/adapters/walletPortfolioDataAdapter";
import { WalletPortfolioErrorState } from "@/components/wallet/portfolio/views/LoadingStates";
import { WalletPortfolioPresenter } from "@/components/wallet/portfolio/WalletPortfolioPresenter";
import { usePortfolioDataProgressive } from "@/hooks/queries/analytics/usePortfolioDataProgressive";
import { useRegimeHistory } from "@/hooks/queries/market/useRegimeHistoryQuery";
import { useSentimentData } from "@/hooks/queries/market/useSentimentQuery";

interface DashboardShellProps {
  urlUserId: string;
  isOwnBundle: boolean;
  bundleUserName?: string;
  bundleUrl?: string;
  headerBanners?: ReactNode;
  footerOverlays?: ReactNode;
}

export function DashboardShell({
  urlUserId,
  isOwnBundle,
  bundleUserName,
  bundleUrl,
  headerBanners,
  footerOverlays,
}: DashboardShellProps) {
  const { unifiedData, sections, isLoading, error, refetch } =
    usePortfolioDataProgressive(urlUserId);
  const { data: sentimentData } = useSentimentData();
  const { data: regimeHistoryData } = useRegimeHistory();
  const safeError = error instanceof Error ? error : null;

  // Keep error state handling (full-page replacement is appropriate for errors)
  if (safeError && !unifiedData) {
    return <WalletPortfolioErrorState error={safeError} onRetry={refetch} />;
  }

  // Determine if this is empty state (no real portfolio data, excluding loading)
  // Use balance and positions - the correct properties from WalletPortfolioDataWithDirection
  const isEmptyState =
    (!unifiedData ||
      ((unifiedData.positions ?? 0) === 0 &&
        (unifiedData.balance ?? 0) === 0)) &&
    !isLoading;

  // Use real data if available, otherwise create empty state with real sentiment
  const portfolioData =
    unifiedData ??
    createEmptyPortfolioState(sentimentData ?? null, regimeHistoryData ?? null);

  return (
    <div
      data-bundle-user-id={urlUserId}
      data-bundle-owner={isOwnBundle ? "own" : "visitor"}
      data-bundle-user-name={bundleUserName ?? ""}
      data-bundle-url={bundleUrl ?? ""}
    >
      <WalletPortfolioPresenter
        data={portfolioData}
        sections={sections}
        userId={urlUserId}
        isOwnBundle={isOwnBundle}
        isEmptyState={isEmptyState}
        isLoading={isLoading}
        headerBanners={headerBanners}
        footerOverlays={footerOverlays}
        onRefresh={refetch}
      />
    </div>
  );
}

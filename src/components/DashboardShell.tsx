"use client";

import type { ReactNode } from "react";

import { createEmptyPortfolioState } from "@/adapters/walletPortfolioDataAdapter";
import {
    WalletPortfolioErrorState,
    WalletPortfolioLoadingState,
} from "@/components/wallet/portfolio/views/LoadingStates";
import { WalletPortfolioPresenter } from "@/components/wallet/portfolio/WalletPortfolioPresenter";
import { usePortfolioData } from "@/hooks/queries/usePortfolioData";
import { useRegimeHistory } from "@/services/regimeHistoryService";
import { useSentimentData } from "@/services/sentimentService";

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
  const { data, isLoading, error, refetch } = usePortfolioData(urlUserId);
  const { data: sentimentData } = useSentimentData();
  const { data: regimeHistoryData } = useRegimeHistory();
  const safeError = error instanceof Error ? error : null;

  if (isLoading && !data) {
    return <WalletPortfolioLoadingState />;
  }

  if (safeError && !data) {
    return <WalletPortfolioErrorState error={safeError} onRetry={refetch} />;
  }

  // Determine if this is empty state (no real portfolio data)
  const isEmptyState = !data;

  // Use real data if available, otherwise create empty state with real sentiment
  const portfolioData =
    data ??
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
        userId={urlUserId}
        isEmptyState={isEmptyState}
        headerBanners={headerBanners}
        footerOverlays={footerOverlays}
      />
    </div>
  );
}

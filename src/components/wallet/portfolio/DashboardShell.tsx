"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { createEmptyPortfolioState } from "@/adapters/walletPortfolioDataAdapter";
import { WalletPortfolioErrorState } from "@/components/wallet/portfolio/views/LoadingStates";
import { WalletPortfolioPresenter } from "@/components/wallet/portfolio/WalletPortfolioPresenter";
import { queryKeys } from "@/hooks/queries";
import { usePortfolioDataProgressive } from "@/hooks/queries/analytics/usePortfolioDataProgressive";
import { useRegimeHistory } from "@/hooks/queries/market/useRegimeHistoryQuery";
import { useSentimentData } from "@/hooks/queries/market/useSentimentQuery";
import { useEtlJobPolling } from "@/hooks/wallet";

interface DashboardShellProps {
  urlUserId: string;
  isOwnBundle: boolean;
  bundleUserName?: string;
  bundleUrl?: string;
  headerBanners?: ReactNode;
  footerOverlays?: ReactNode;
  initialEtlJobId?: string | undefined;
  isNewUser?: boolean | undefined;
}

export function DashboardShell({
  urlUserId,
  isOwnBundle,
  bundleUserName,
  bundleUrl,
  headerBanners,
  footerOverlays,
  initialEtlJobId,
  isNewUser,
}: DashboardShellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ETL Polling for new wallets
  const {
    state: etlState,
    reset: resetEtl,
    startPolling,
    completeTransition,
  } = useEtlJobPolling();
  const isEtlInProgress = ["pending", "processing", "completing"].includes(
    etlState.status
  );

  // Portfolio data with ETL-aware queries
  const { unifiedData, sections, isLoading, error, refetch } =
    usePortfolioDataProgressive(urlUserId, isEtlInProgress);

  // Start polling when initialEtlJobId is provided
  useEffect(() => {
    if (initialEtlJobId && !etlState.jobId) {
      startPolling(initialEtlJobId);
    }
  }, [initialEtlJobId, etlState.jobId, startPolling]);

  // Handle ETL completion auto-refresh
  // When status transitions to "completing", coordinate cache invalidation and refetch
  useEffect(() => {
    if (etlState.status !== "completing") {
      return;
    }

    const handleCompletion = async () => {
      // 1. Wait for cache invalidation to complete
      await queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.landingPage(urlUserId),
      });

      // 2. Trigger refetch and wait for it to complete
      await refetch();

      // 3. Clean URL params
      const url = new URL(window.location.href);
      if (
        url.searchParams.has("etlJobId") ||
        url.searchParams.has("isNewUser")
      ) {
        url.searchParams.delete("etlJobId");
        url.searchParams.delete("isNewUser");
        router.replace(url.pathname + url.search, { scroll: false });
      }

      // 4. Complete the transition (moves state from "completing" to "idle")
      completeTransition();
    };

    void handleCompletion();
  }, [
    etlState.status,
    refetch,
    completeTransition,
    urlUserId,
    queryClient,
    router,
  ]);
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
        initialEtlJobId={initialEtlJobId}
        isNewUser={isNewUser}
        etlState={etlState}
        onResetEtl={resetEtl}
        headerBanners={headerBanners}
        footerOverlays={footerOverlays}
        onRefresh={refetch}
      />
    </div>
  );
}

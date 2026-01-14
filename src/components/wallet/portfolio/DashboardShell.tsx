"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

import { createEmptyPortfolioState } from "@/adapters/walletPortfolioDataAdapter";
import { WalletPortfolioErrorState } from "@/components/wallet/portfolio/views/LoadingStates";
import { WalletPortfolioPresenter } from "@/components/wallet/portfolio/WalletPortfolioPresenter";
import { queryKeys } from "@/hooks/queries";
import { usePortfolioDataProgressive } from "@/hooks/queries/analytics/usePortfolioDataProgressive";
import { useRegimeHistory } from "@/hooks/queries/market/useRegimeHistoryQuery";
import { useSentimentData } from "@/hooks/queries/market/useSentimentQuery";
import { useEtlJobPolling } from "@/hooks/wallet";
import { logger } from "@/utils/logger";

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
}: DashboardShellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ETL Polling for new wallets
  const {
    state: etlState,
    startPolling,
    completeTransition,
  } = useEtlJobPolling();
  const isEtlInProgress = ["pending", "processing", "completing"].includes(
    etlState.status
  );
  const activeEtlJobIdRef = useRef<string | null>(null);

  // Portfolio data with ETL-aware queries
  const { unifiedData, sections, isLoading, error, refetch } =
    usePortfolioDataProgressive(urlUserId, isEtlInProgress);

  // Start polling when initialEtlJobId is provided
  useEffect(() => {
    if (!initialEtlJobId || initialEtlJobId === activeEtlJobIdRef.current) {
      return;
    }
    activeEtlJobIdRef.current = initialEtlJobId;
    startPolling(initialEtlJobId);
  }, [initialEtlJobId, startPolling]);

  useEffect(() => {
    activeEtlJobIdRef.current = etlState.jobId;
  }, [etlState.jobId]);

  // Handle ETL completion auto-refresh
  // When status transitions to "completing", coordinate cache invalidation and refetch
  useEffect(() => {
    if (etlState.status !== "completing" || !etlState.jobId) {
      return;
    }

    const handleCompletion = async () => {
      const completingJobId = etlState.jobId;

      // 1. Wait for cache invalidation to complete
      await queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.landingPage(urlUserId),
      });

      // 2. Trigger refetch and wait for it to complete
      await refetch();

      // 3. Clean URL params
      if (activeEtlJobIdRef.current !== completingJobId) {
        return;
      }

      const url = new URL(window.location.href);
      const urlJobId = url.searchParams.get("etlJobId");
      const shouldClearParams =
        urlJobId === completingJobId || url.searchParams.has("isNewUser");
      if (shouldClearParams) {
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
    etlState.jobId,
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

  // Debug logging for button disable issue
  logger.debug("[DashboardShell] Debug State:", {
    unifiedData: unifiedData ? "exists" : "null",
    balance: unifiedData?.balance ?? "N/A",
    positions: unifiedData?.positions ?? "N/A",
    isLoading,
    error: error ? error.message : null,
  });

  // Determine if this is empty state (no real portfolio data)
  // Ghost mode shows when loading complete AND (wallet disconnected OR empty portfolio)
  // - unifiedData === null: wallet disconnected, no user to query
  // - unifiedData with zero positions/balance: connected but empty portfolio
  const isEmptyState =
    !isLoading &&
    (unifiedData === null ||
      ((unifiedData.positions ?? 0) === 0 && (unifiedData.balance ?? 0) === 0));

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
        etlState={etlState}
        headerBanners={headerBanners}
        footerOverlays={footerOverlays}
      />
    </div>
  );
}

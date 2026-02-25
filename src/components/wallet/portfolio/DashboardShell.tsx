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

type EtlState = ReturnType<typeof useEtlJobPolling>["state"];

function isEtlProcessing(status: EtlState["status"]): boolean {
  return ["pending", "processing", "completing"].includes(status);
}

function useStartPollingFromInitialJobId(
  initialEtlJobId: string | undefined,
  startPolling: (jobId: string) => void,
  activeEtlJobIdRef: { current: string | null }
): void {
  useEffect(() => {
    if (!initialEtlJobId || initialEtlJobId === activeEtlJobIdRef.current) {
      return;
    }

    activeEtlJobIdRef.current = initialEtlJobId;
    startPolling(initialEtlJobId);
  }, [activeEtlJobIdRef, initialEtlJobId, startPolling]);
}

function useTrackActiveEtlJobId(
  etlJobId: string | null,
  activeEtlJobIdRef: { current: string | null }
): void {
  useEffect(() => {
    activeEtlJobIdRef.current = etlJobId;
  }, [activeEtlJobIdRef, etlJobId]);
}

function shouldClearEtlUrlParams(completingJobId: string): boolean {
  const url = new URL(window.location.href);
  const urlJobId = url.searchParams.get("etlJobId");
  return urlJobId === completingJobId || url.searchParams.has("isNewUser");
}

function clearEtlUrlParams(router: ReturnType<typeof useRouter>): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("etlJobId");
  url.searchParams.delete("isNewUser");
  router.replace(url.pathname + url.search, { scroll: false });
}

interface CompletionSyncParams {
  etlState: EtlState;
  queryClient: ReturnType<typeof useQueryClient>;
  urlUserId: string;
  refetch: () => Promise<unknown>;
  activeEtlJobIdRef: { current: string | null };
  router: ReturnType<typeof useRouter>;
  completeTransition: () => void;
}

function useSyncOnEtlCompletion({
  etlState,
  queryClient,
  urlUserId,
  refetch,
  activeEtlJobIdRef,
  router,
  completeTransition,
}: CompletionSyncParams): void {
  useEffect(() => {
    if (etlState.status !== "completing" || !etlState.jobId) {
      return;
    }

    const handleCompletion = async (): Promise<void> => {
      const completingJobId = etlState.jobId;
      if (!completingJobId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.landingPage(urlUserId),
      });
      await refetch();

      if (activeEtlJobIdRef.current !== completingJobId) {
        return;
      }

      if (shouldClearEtlUrlParams(completingJobId)) {
        clearEtlUrlParams(router);
      }

      completeTransition();
    };

    void handleCompletion();
  }, [
    activeEtlJobIdRef,
    completeTransition,
    etlState.jobId,
    etlState.status,
    queryClient,
    refetch,
    router,
    urlUserId,
  ]);
}

function getSafeError(error: Error | null | unknown): Error | null {
  return error instanceof Error ? error : null;
}

function computeIsEmptyState(
  isLoading: boolean,
  unifiedData: { positions?: number; balance?: number } | null
): boolean {
  return Boolean(
    !isLoading &&
      (unifiedData === null ||
        ((unifiedData.positions ?? 0) === 0 &&
          (unifiedData.balance ?? 0) === 0))
  );
}

function logDashboardState(
  unifiedData: { balance?: number; positions?: number } | null,
  isLoading: boolean,
  error: Error | null
): void {
  logger.debug("[DashboardShell] Debug State:", {
    unifiedData: unifiedData ? "exists" : "null",
    balance: unifiedData?.balance ?? "N/A",
    positions: unifiedData?.positions ?? "N/A",
    isLoading,
    error: error ? error.message : null,
  });
}

interface DashboardShellViewProps {
  urlUserId: string;
  isOwnBundle: boolean;
  bundleUserName: string | undefined;
  bundleUrl: string | undefined;
  portfolioData: ReturnType<typeof createEmptyPortfolioState>;
  sections: ReturnType<typeof usePortfolioDataProgressive>["sections"];
  isEmptyState: boolean;
  isLoading: boolean;
  etlState: EtlState;
  headerBanners?: ReactNode;
  footerOverlays?: ReactNode;
}

function DashboardShellView({
  urlUserId,
  isOwnBundle,
  bundleUserName,
  bundleUrl,
  portfolioData,
  sections,
  isEmptyState,
  isLoading,
  etlState,
  headerBanners,
  footerOverlays,
}: DashboardShellViewProps): ReactNode {
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
  const isEtlInProgress = isEtlProcessing(etlState.status);
  const activeEtlJobIdRef = useRef<string | null>(null);

  // Portfolio data with ETL-aware queries
  const { unifiedData, sections, isLoading, error, refetch } =
    usePortfolioDataProgressive(urlUserId, isEtlInProgress);

  useStartPollingFromInitialJobId(
    initialEtlJobId,
    startPolling,
    activeEtlJobIdRef
  );
  useTrackActiveEtlJobId(etlState.jobId, activeEtlJobIdRef);
  useSyncOnEtlCompletion({
    etlState,
    queryClient,
    urlUserId,
    refetch,
    activeEtlJobIdRef,
    router,
    completeTransition,
  });
  const { data: sentimentData } = useSentimentData();
  const { data: regimeHistoryData } = useRegimeHistory();
  const safeError = getSafeError(error);

  if (safeError && !unifiedData) {
    return <WalletPortfolioErrorState error={safeError} onRetry={refetch} />;
  }

  logDashboardState(unifiedData, isLoading, safeError);
  const isEmptyState = computeIsEmptyState(isLoading, unifiedData);
  const portfolioData =
    unifiedData ??
    createEmptyPortfolioState(sentimentData ?? null, regimeHistoryData ?? null);

  return (
    <DashboardShellView
      urlUserId={urlUserId}
      isOwnBundle={isOwnBundle}
      bundleUserName={bundleUserName}
      bundleUrl={bundleUrl}
      portfolioData={portfolioData}
      sections={sections}
      isEmptyState={isEmptyState}
      isLoading={isLoading}
      etlState={etlState}
      headerBanners={headerBanners}
      footerOverlays={footerOverlays}
    />
  );
}

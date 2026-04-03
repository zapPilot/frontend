import { type QueryClient } from "@tanstack/react-query";
import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useEffect, useRef } from "react";

import { queryKeys } from "@/hooks/queries";

import type { EtlJobPollingState } from "./useEtlJobPolling";

interface UseEtlJobSyncParams {
  initialEtlJobId: string | undefined;
  etlState: EtlJobPollingState;
  startPolling: (jobId: string) => void;
  completeTransition: () => void;
  urlUserId: string;
  refetch: () => Promise<unknown>;
  queryClient: QueryClient;
  router: AppRouterInstance;
}

function shouldClearEtlUrlParams(completingJobId: string): boolean {
  const url = new URL(window.location.href);
  const urlJobId = url.searchParams.get("etlJobId");
  return urlJobId === completingJobId || url.searchParams.has("isNewUser");
}

function clearEtlUrlParams(router: AppRouterInstance): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("etlJobId");
  url.searchParams.delete("isNewUser");
  router.replace(url.pathname + url.search, { scroll: false });
}

export function useEtlJobSync({
  initialEtlJobId,
  etlState,
  startPolling,
  completeTransition,
  urlUserId,
  refetch,
  queryClient,
  router,
}: UseEtlJobSyncParams): void {
  const activeEtlJobIdRef = useRef<string | null>(null);

  // Start polling from initial job ID (e.g. from URL params)
  useEffect(() => {
    if (!initialEtlJobId || initialEtlJobId === activeEtlJobIdRef.current) {
      return;
    }

    activeEtlJobIdRef.current = initialEtlJobId;
    startPolling(initialEtlJobId);
  }, [initialEtlJobId, startPolling]);

  // Track active ETL job ID changes
  useEffect(() => {
    activeEtlJobIdRef.current = etlState.jobId;
  }, [etlState.jobId]);

  // Sync on ETL completion: invalidate queries, refetch, clean URL
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
    completeTransition,
    etlState.jobId,
    etlState.status,
    queryClient,
    refetch,
    router,
    urlUserId,
  ]);
}

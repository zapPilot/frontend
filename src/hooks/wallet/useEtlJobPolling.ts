/**
 * useEtlJobPolling Hook
 *
 * React Query hook for polling ETL job status.
 * Used for on-the-fly wallet data fetching.
 *
 * Features:
 * - Auto-polls job status every 3 seconds while job is pending/processing
 * - Auto-stops polling when job completes or fails
 * - Provides loading states and error handling
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import {
    type EtlJobResponse,
    type EtlJobStatusResponse,
    getEtlJobStatus,
    triggerWalletDataFetch,
} from "@/services/accountService";

/**
 * ETL job polling state
 */
export interface EtlJobPollingState {
  /** Current job ID being polled */
  jobId: string | null;
  /** Current job status */
  status:
    | "idle"
    | "pending"
    | "processing"
    | "completing"
    | "completed"
    | "failed";
  /** Error message if job failed */
  errorMessage: string | undefined;
  /** Whether the job is currently loading */
  isLoading: boolean;
}

/**
 * Hook return type
 */
export interface UseEtlJobPollingReturn {
  /** Current polling state */
  state: EtlJobPollingState;
  /** Trigger a new ETL job for a wallet */
  triggerEtl: (userId: string, walletAddress: string) => Promise<void>;
  /** Start polling an existing ETL job */
  startPolling: (jobId: string) => void;
  /** Reset the polling state */
  reset: () => void;
  /** Complete the transition from 'completing' to 'idle' */
  completeTransition: () => void;
}

const ETL_JOB_QUERY_KEY = ["etl-job-status"];
const POLLING_INTERVAL = 3000; // 3 seconds

const normalizeStatus = (
  status: string
): EtlJobPollingState["status"] =>
  status === "completed"
    ? "completing"
    : (status as EtlJobPollingState["status"]);

/**
 * Hook for polling ETL job status
 *
 * @example
 * ```tsx
 * const { state, triggerEtl, reset } = useEtlJobPolling();
 *
 * // Trigger ETL when wallet connects
 * await triggerEtl(userId, walletAddress);
 *
 * // Show loading UI while processing
 * if (state.isLoading) {
 *   return <LoadingSpinner />;
 * }
 * ```
 */
export function useEtlJobPolling(): UseEtlJobPollingReturn {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [triggerError, setTriggerError] = useState<string | undefined>();
  const [latestStatus, setLatestStatus] = useState<
    EtlJobPollingState["status"] | null
  >(null);

  // Poll job status when we have a job ID
  const { data: jobStatus, isLoading: isPolling } =
    useQuery<EtlJobStatusResponse>({
      queryKey: [...ETL_JOB_QUERY_KEY, jobId],
      queryFn: () => getEtlJobStatus(jobId!),
      enabled: !!jobId,
      refetchInterval: (query) => {
        const data = query.state.data;
        // Stop polling when job is completed or failed
        if (data?.status === "completed" || data?.status === "failed") {
          return false;
        }
        return POLLING_INTERVAL;
      },
      staleTime: 0, // Always refetch
    });

  useEffect(() => {
    if (!jobStatus) return;
    setLatestStatus(normalizeStatus(jobStatus.status));
  }, [jobStatus]);

  // Determine current state
  // Map "completed" from API to "completing" to prevent premature query re-enablement
  const deriveStatus = (): EtlJobPollingState["status"] => {
    if (!jobId) return "idle";
    if (jobStatus) return normalizeStatus(jobStatus.status);
    if (latestStatus) return latestStatus;
    return "pending";
  };

  const state: EtlJobPollingState = {
    jobId,
    status: deriveStatus(),
    errorMessage: triggerError || jobStatus?.error_message,
    isLoading: isPolling || (!!jobId && jobStatus?.status === "pending"),
  };

  // Trigger a new ETL job
  const triggerEtl = useCallback(
    async (userId: string, walletAddress: string) => {
      setTriggerError(undefined);

      try {
        const response: EtlJobResponse = await triggerWalletDataFetch(
          userId,
          walletAddress
        );

        if (response.rate_limited) {
          setTriggerError(response.message);
          return;
        }

        if (response.job_id) {
          setLatestStatus("pending");
          setJobId(response.job_id);
        }
      } catch (error) {
        setTriggerError(
          error instanceof Error ? error.message : "Failed to trigger ETL"
        );
      }
    },
    []
  );

  const startPolling = useCallback((existingJobId: string) => {
    if (!existingJobId) {
      return;
    }
    setTriggerError(undefined);
    setLatestStatus("pending");
    setJobId(existingJobId);
  }, []);

  // Reset polling state
  const reset = useCallback(() => {
    setJobId(null);
    setTriggerError(undefined);
    setLatestStatus(null);
    queryClient.removeQueries({ queryKey: ETL_JOB_QUERY_KEY });
  }, [queryClient]);

  // Complete the transition from 'completing' to 'idle'
  // This should be called after data refetch completes in the parent component
  const completeTransition = useCallback(() => {
    reset();
  }, [reset]);

  return { state, triggerEtl, startPolling, reset, completeTransition };
}

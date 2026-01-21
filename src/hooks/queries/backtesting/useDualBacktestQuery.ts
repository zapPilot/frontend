import { useQueries } from "@tanstack/react-query";
import {
  runBacktest,
  runSimpleBacktest,
  convertToSimpleRequest,
} from "@/services/backtestingService";
import type { BacktestRequest, BacktestResponse } from "@/types/backtesting";

/**
 * Dual-endpoint backtest query hook.
 *
 * Fetches data from BOTH /dca-comparison (Full) and /dca-comparison-simple (Simple)
 * endpoints in parallel for comprehensive strategy comparison.
 *
 * @param params - Backtest request parameters (Full endpoint format)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Object with data from both endpoints and combined loading/error states
 *
 * @example
 * ```typescript
 * const { fullData, simpleData, isLoading, refetch } = useDualBacktestQuery(params);
 *
 * if (isLoading) return <Spinner />;
 * if (isFullSuccess) {
 *   // Both endpoints succeeded
 *   const merged = mergeBacktestTimelines(fullData, simpleData);
 * }
 * ```
 */
export function useDualBacktestQuery(
  params: BacktestRequest,
  enabled: boolean = true
) {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["backtest", "full", params],
        queryFn: () => runBacktest(params),
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: 1,
      },
      {
        queryKey: ["backtest", "simple", convertToSimpleRequest(params)],
        queryFn: () => runSimpleBacktest(convertToSimpleRequest(params)),
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: 1,
      },
    ],
  });

  const [fullQuery, simpleQuery] = queries;

  return {
    /** Full endpoint response data */
    fullData: (fullQuery.data as BacktestResponse | undefined) ?? null,
    /** Simple endpoint response data */
    simpleData: (simpleQuery.data as BacktestResponse | undefined) ?? null,
    /** True if either query is in initial loading state */
    isLoading: fullQuery.isLoading || simpleQuery.isLoading,
    /** True if either query is pending (includes background refetch) */
    isPending: fullQuery.isPending || simpleQuery.isPending,
    /** First error encountered (prioritizes Full endpoint) */
    error: fullQuery.error || simpleQuery.error,
    /** Full endpoint-specific error */
    fullError: fullQuery.error,
    /** Simple endpoint-specific error */
    simpleError: simpleQuery.error,
    /** True if only one endpoint succeeded */
    isPartialSuccess:
      (!!fullQuery.data && !simpleQuery.data) ||
      (!fullQuery.data && !!simpleQuery.data),
    /** True if both endpoints succeeded */
    isFullSuccess: !!fullQuery.data && !!simpleQuery.data,
    /** Refetch both queries */
    refetch: () => {
      void fullQuery.refetch();
      void simpleQuery.refetch();
    },
  };
}

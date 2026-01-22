import { useMutation } from "@tanstack/react-query";

import {
  runBacktest,
  runSimpleBacktest,
} from "@/services/backtestingService";
import {
  BacktestEndpointMode,
  BacktestRequest,
  SimpleBacktestRequest,
} from "@/types/backtesting";

interface BacktestMutationParams {
  request: BacktestRequest | SimpleBacktestRequest;
  endpointMode: BacktestEndpointMode;
}

/**
 * React Query mutation hook for running backtests.
 *
 * Executes either the full DCA comparison backtest or the simplified version
 * against the analytics-engine API, based on the endpoint mode.
 */
export function useBacktestMutation() {
  return useMutation({
    mutationFn: ({ request, endpointMode }: BacktestMutationParams) => {
      if (endpointMode === "simple") {
        return runSimpleBacktest(request as SimpleBacktestRequest);
      }
      return runBacktest(request as BacktestRequest);
    },
  });
}

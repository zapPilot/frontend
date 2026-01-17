import { useMutation } from "@tanstack/react-query";

import { runBacktest } from "@/services/backtestingService";
import { BacktestRequest } from "@/types/backtesting";

/**
 * React Query mutation hook for running backtests.
 *
 * Executes the DCA comparison backtest against the analytics-engine API.
 */
export function useBacktestMutation() {
  return useMutation({
    mutationFn: (request: BacktestRequest) => runBacktest(request),
  });
}

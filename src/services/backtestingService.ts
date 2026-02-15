import { httpUtils } from "@/lib/http";
import { createApiServiceCaller } from "@/lib/http/createApiServiceCaller";
import {
  enrichTimelineWithDma200,
  MAX_CHART_POINTS,
  MIN_CHART_POINTS,
  sampleTimelineData,
} from "@/services/backtestingTimeline";
import type {
  BacktestRequest,
  BacktestResponse,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";

const callBacktestingApi = createApiServiceCaller(
  {
    400: "Invalid backtest parameters. Please review your inputs and try again.",
    404: "Backtest endpoint not found. Please verify analytics-engine is running.",
    500: "An unexpected error occurred while running the backtest.",
    503: "Backtest service is temporarily unavailable. Please try again later.",
    504: "Backtest request timed out. Please try again.",
  },
  "Failed to run backtest"
);

/**
 * Run the DCA comparison backtest.
 *
 * Automatically samples the timeline data to reduce browser RAM usage
 * while preserving important trading signals (buy/sell events).
 *
 * Uses a custom 10-minute timeout to accommodate complex backtesting
 * calculations that may involve:
 * - Multiple allocation strategies
 * - Extended historical data ranges (90+ days)
 * - High computational load on the analytics server
 */
/**
 * Export internal helpers for testing purposes.
 * @internal - Not part of the public API
 */
export {
  enrichTimelineWithDma200 as _enrichTimelineWithDma200,
  sampleTimelineData as _sampleTimelineData,
};
export { MAX_CHART_POINTS, MIN_CHART_POINTS };

export async function getBacktestingStrategiesV3(): Promise<BacktestStrategyCatalogResponseV3> {
  return callBacktestingApi(() =>
    httpUtils.analyticsEngine.get<BacktestStrategyCatalogResponseV3>(
      "/api/v3/backtesting/strategies"
    )
  );
}

export async function runBacktest(
  request: BacktestRequest
): Promise<BacktestResponse> {
  const response = await callBacktestingApi(() =>
    httpUtils.analyticsEngine.post<BacktestResponse>(
      "/api/v3/backtesting/compare",
      request,
      {
        timeout: 600000, // 10 minutes (20x default timeout for complex backtests)
      }
    )
  );

  // Compute DMA200 on the full timeline first, then sample while preserving events.
  const timelineWithDma = enrichTimelineWithDma200(response.timeline);

  // Sample timeline data to reduce memory usage while preserving signals
  return {
    ...response,
    timeline: sampleTimelineData(timelineWithDma),
  };
}

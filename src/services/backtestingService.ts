import { httpUtils } from "@/lib/http";
import { createApiServiceCaller } from "@/lib/http/createApiServiceCaller";
import {
  MAX_CHART_POINTS,
  MIN_CHART_POINTS,
  sampleTimelineData,
} from "@/services/backtestingTimeline";
import type {
  BacktestRequest,
  BacktestResponse,
  BacktestStrategyCatalogResponseV3,
  BacktestTimelinePoint,
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

/** @internal — test-only re-exports */
export { sampleTimelineData as _sampleTimelineData };
export { MAX_CHART_POINTS, MIN_CHART_POINTS };

/**
 * Legacy test helper retained during the DMA-first migration.
 * The backend now returns DMA values directly inside strategy.signal.details.dma.
 *
 * @internal
 */
export function _enrichTimelineWithDma200(
  timeline: BacktestTimelinePoint[] | undefined
): BacktestTimelinePoint[] {
  return timeline ?? [];
}

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

  // Sample timeline data to reduce memory usage while preserving signals
  return {
    ...response,
    timeline: sampleTimelineData(response.timeline),
  };
}

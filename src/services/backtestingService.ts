import { APIError, httpUtils } from "@/lib/http";
import { createErrorMapper } from "@/lib/http/createErrorMapper";
import { createServiceCaller } from "@/lib/http/createServiceCaller";
import { BacktestRequest, BacktestResponse } from "@/types/backtesting";

const createBacktestingServiceError = createErrorMapper(
  (message, status, code, details) =>
    new APIError(message, status, code, details),
  {
    400: "Invalid backtest parameters. Please review your inputs and try again.",
    404: "Backtest endpoint not found. Please verify analytics-engine is running.",
    500: "An unexpected error occurred while running the backtest.",
    503: "Backtest service is temporarily unavailable. Please try again later.",
    504: "Backtest request timed out. Please try again.",
  },
  "Failed to run backtest"
);

const callBacktestingApi = createServiceCaller(createBacktestingServiceError);

/**
 * Run the DCA comparison backtest.
 */
export async function runBacktest(
  request: BacktestRequest
): Promise<BacktestResponse> {
  return callBacktestingApi(() =>
    httpUtils.analyticsEngine.post<BacktestResponse>(
      "/api/v2/backtesting/dca-comparison",
      request
    )
  );
}

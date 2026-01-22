import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { httpUtils } from "@/lib/http";
import { runBacktest } from "@/services/backtestingService";
import { BacktestRequest, BacktestResponse } from "@/types/backtesting";

const analyticsEnginePostSpy = vi.spyOn(httpUtils.analyticsEngine, "post");

describe("backtestingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsEnginePostSpy.mockReset();
  });

  afterAll(() => {
    analyticsEnginePostSpy.mockRestore();
  });

  describe("runBacktest", () => {
    it("should call the correct endpoint with the provided request", async () => {
      const mockRequest: BacktestRequest = {
        capital: 10000,
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      };

      const mockResponse: BacktestResponse = {
        comparison: {
          metrics: {
            total_return_usd: 1000,
            total_return_pct: 10,
            max_drawdown_pct: 5,
            sharpe_ratio: 1.5,
            volatility: 0.2,
            winning_trades_pct: 0.6,
          },
          curve: [],
        },
        strategies: {
          dca: {
            metrics: {
              total_return_usd: 500,
              total_return_pct: 5,
              max_drawdown_pct: 10,
              sharpe_ratio: 1.0,
              volatility: 0.25,
            },
            curve: [],
          },
          regime_dca: {
            metrics: {
              total_return_usd: 1500,
              total_return_pct: 15,
              max_drawdown_pct: 3,
              sharpe_ratio: 2.0,
              volatility: 0.15,
            },
            curve: [],
          },
        },
        parameters: {
          capital: 10000,
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        },
        timeline: [],
      };

      analyticsEnginePostSpy.mockResolvedValue(mockResponse);

      const result = await runBacktest(mockRequest);

      expect(analyticsEnginePostSpy).toHaveBeenCalledWith(
        "/api/v2/backtesting/dca-comparison",
        mockRequest
      );
      expect(result).toEqual(mockResponse);
    });

    it("should propagate errors from the API", async () => {
      const mockRequest: BacktestRequest = {
        capital: 10000,
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      };

      const error = new Error("API Error");
      analyticsEnginePostSpy.mockRejectedValue(error);

      await expect(runBacktest(mockRequest)).rejects.toThrow(
        "An unexpected error occurred while running the backtest."
      );
    });
  });
});

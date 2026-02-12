import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { httpUtils } from "@/lib/http";
import {
  _enrichTimelineWithDma200 as enrichTimelineWithDma200,
  _sampleTimelineData as sampleTimelineData,
  getBacktestingStrategiesV3,
  MAX_CHART_POINTS,
  MIN_CHART_POINTS,
  runBacktest,
} from "@/services/backtestingService";
import type {
  BacktestRequest,
  BacktestTimelinePoint,
} from "@/types/backtesting";

function createTimelinePoint(
  index: number,
  opts?: { withTransfers?: boolean }
): BacktestTimelinePoint {
  const baseDate = new Date("2024-01-01");
  baseDate.setDate(baseDate.getDate() + index);
  const dateStr = baseDate.toISOString().split("T")[0] ?? "2024-01-01";

  const regimeMetrics: Record<string, unknown> = {
    signal: "fear",
  };
  if (opts?.withTransfers) {
    regimeMetrics["metadata"] = {
      transfers: [{ from_bucket: "spot", to_bucket: "lp", amount_usd: 123 }],
    };
  }

  return {
    date: dateStr,
    token_price: { btc: 50000 + index * 10 },
    sentiment: 50,
    sentiment_label: "neutral",
    strategies: {
      // Baseline is detected by `metrics.signal === "dca"`.
      dca_classic: {
        portfolio_value: 10000 + index * 5,
        portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
        event: "buy",
        metrics: { signal: "dca" },
      },
      simple_regime: {
        portfolio_value: 10000 + index * 8,
        portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
        event: opts?.withTransfers ? "rebalance" : null,
        metrics: regimeMetrics,
      },
    },
  };
}

const analyticsEnginePostSpy = vi.spyOn(httpUtils.analyticsEngine, "post");
const analyticsEngineGetSpy = vi.spyOn(httpUtils.analyticsEngine, "get");

describe("backtestingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsEnginePostSpy.mockReset();
    analyticsEngineGetSpy.mockReset();
  });

  afterAll(() => {
    analyticsEnginePostSpy.mockRestore();
    analyticsEngineGetSpy.mockRestore();
  });

  describe("runBacktest", () => {
    it("calls v3 compare endpoint with a 10-minute timeout", async () => {
      const mockRequest: BacktestRequest = {
        token_symbol: "BTC",
        total_capital: 10000,
        days: 30,
        configs: [
          { config_id: "dca_classic", strategy_id: "dca_classic", params: {} },
          {
            config_id: "simple_regime",
            strategy_id: "simple_regime",
            params: { pacing_policy: "fgi_linear" },
          },
        ],
      };

      analyticsEnginePostSpy.mockResolvedValue({
        strategies: {},
        timeline: [],
      });

      await runBacktest(mockRequest);

      expect(analyticsEnginePostSpy).toHaveBeenCalledWith(
        "/api/v3/backtesting/compare",
        mockRequest,
        { timeout: 600000 }
      );
    });

    it("propagates API errors using the backtesting error mapper", async () => {
      analyticsEnginePostSpy.mockRejectedValue(new Error("API Error"));

      await expect(
        runBacktest({
          token_symbol: "BTC",
          total_capital: 10000,
          configs: [{ config_id: "dca_classic", strategy_id: "dca_classic" }],
        })
      ).rejects.toThrow(
        "An unexpected error occurred while running the backtest."
      );
    });

    it("computes DMA from full timeline before downsampling", async () => {
      const timeline = Array.from({ length: 220 }, (_, i) =>
        createTimelinePoint(i)
      );

      analyticsEnginePostSpy.mockResolvedValue({
        strategies: {},
        timeline,
      });

      const result = await runBacktest({
        token_symbol: "BTC",
        total_capital: 10000,
        configs: [{ config_id: "dca_classic", strategy_id: "dca_classic" }],
      });

      expect(result.timeline.length).toBeLessThanOrEqual(MAX_CHART_POINTS);
      const lastPoint = result.timeline[result.timeline.length - 1];
      expect(lastPoint?.dma_200).toBeTypeOf("number");
    });
  });

  describe("enrichTimelineWithDma200", () => {
    it("sets null for first 199 points and day-200 average at index 199", () => {
      const timeline = Array.from({ length: 205 }, (_, i) =>
        createTimelinePoint(i)
      );
      const result = enrichTimelineWithDma200(timeline);

      for (let i = 0; i < 199; i++) {
        expect(result[i]?.dma_200).toBeNull();
      }

      const expectedAt199 =
        timeline
          .slice(0, 200)
          .reduce((acc, point) => acc + (point.token_price.btc ?? 0), 0) / 200;
      expect(result[199]?.dma_200).toBeCloseTo(expectedAt199, 10);
    });

    it("rolls deterministically over the next day", () => {
      const timeline = Array.from({ length: 205 }, (_, i) =>
        createTimelinePoint(i)
      );
      const result = enrichTimelineWithDma200(timeline);

      const expectedAt200 =
        timeline
          .slice(1, 201)
          .reduce((acc, point) => acc + (point.token_price.btc ?? 0), 0) / 200;
      expect(result[200]?.dma_200).toBeCloseTo(expectedAt200, 10);
    });

    it("falls back to first numeric token price when btc is missing", () => {
      const timeline = Array.from({ length: 205 }, (_, i) => {
        const point = createTimelinePoint(i);
        return {
          ...point,
          token_price: {
            eth: (point.token_price.btc ?? 0) + 100,
          },
        };
      });

      const result = enrichTimelineWithDma200(timeline);
      const expectedAt199 =
        timeline
          .slice(0, 200)
          .reduce(
            (acc, point) => acc + (Object.values(point.token_price)[0] ?? 0),
            0
          ) / 200;

      expect(result[199]?.dma_200).toBeCloseTo(expectedAt199, 10);
    });

    it("resets dma_200 to null when encountering empty token_price", () => {
      const timeline = Array.from({ length: 205 }, (_, i) => {
        const point = createTimelinePoint(i);
        if (i === 201) return { ...point, token_price: {} };
        return point;
      });

      const result = enrichTimelineWithDma200(timeline);

      for (let i = 201; i <= 204; i++) {
        expect(result[i]?.dma_200).toBeNull();
      }
    });
  });

  describe("sampleTimelineData", () => {
    it("returns empty array for undefined/empty timeline", () => {
      expect(sampleTimelineData(undefined)).toEqual([]);
      expect(sampleTimelineData([])).toEqual([]);
    });

    it("returns timeline unchanged when <= minPoints", () => {
      const timeline = Array.from({ length: MIN_CHART_POINTS }, (_, i) =>
        createTimelinePoint(i)
      );
      expect(sampleTimelineData(timeline)).toEqual(timeline);
    });

    it("preserves first and last points and all transfer points", () => {
      const transferIndices = [10, 50, 150, 300, 450];
      const timeline = Array.from({ length: 500 }, (_, i) =>
        createTimelinePoint(i, { withTransfers: transferIndices.includes(i) })
      );

      const result = sampleTimelineData(timeline);
      const resultDates = new Set(result.map(p => p.date));

      expect(resultDates.has(timeline[0]?.date ?? "")).toBe(true);
      expect(resultDates.has(timeline[timeline.length - 1]?.date ?? "")).toBe(
        true
      );

      for (const idx of transferIndices) {
        expect(resultDates.has(timeline[idx]?.date ?? "")).toBe(true);
      }
    });

    it("does not treat baseline daily buys as critical points", () => {
      // If baseline was treated as critical, we would likely return the full timeline.
      const timeline = Array.from({ length: 500 }, (_, i) =>
        createTimelinePoint(i, { withTransfers: i === 250 })
      );
      const result = sampleTimelineData(timeline);

      expect(result.length).toBeLessThanOrEqual(MAX_CHART_POINTS);
      expect(result.length).toBeLessThan(timeline.length);
    });

    it("returns only critical points when events exhaust all slots", () => {
      // Create timeline where 140+ points have transfers - exceeds MAX_CHART_POINTS
      const timeline = Array.from({ length: 500 }, (_, i) =>
        createTimelinePoint(i, { withTransfers: i > 0 && i < 141 })
      );
      const result = sampleTimelineData(timeline);

      // All returned points should be critical (first, last, or transfer points)
      expect(result.length).toBeLessThanOrEqual(MAX_CHART_POINTS);
      expect(result.length).toBeGreaterThan(0);

      // First and last points preserved
      expect(result[0]?.date).toBe(timeline[0]?.date);
      expect(result[result.length - 1]?.date).toBe(
        timeline[timeline.length - 1]?.date
      );
    });
  });

  describe("getBacktestingStrategiesV3", () => {
    it("calls the v3 strategies endpoint via GET", async () => {
      const mockStrategies = {
        strategies: [{ id: "dca_classic", name: "DCA Classic" }],
      };
      analyticsEngineGetSpy.mockResolvedValue(mockStrategies);

      const result = await getBacktestingStrategiesV3();

      expect(analyticsEngineGetSpy).toHaveBeenCalledWith(
        "/api/v3/backtesting/strategies"
      );
      expect(result).toEqual(mockStrategies);
    });

    it("propagates API errors using the backtesting error mapper", async () => {
      analyticsEngineGetSpy.mockRejectedValue(new Error("API Error"));

      await expect(getBacktestingStrategiesV3()).rejects.toThrow(
        "An unexpected error occurred while running the backtest."
      );
    });
  });
});

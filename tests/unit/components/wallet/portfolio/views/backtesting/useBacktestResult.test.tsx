import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useBacktestResult } from "@/components/wallet/portfolio/views/backtesting/hooks/useBacktestResult";

describe("useBacktestResult markers", () => {
  it("derives buy/sell markers from metrics.metadata.transfers", () => {
    const response = {
      strategies: {
        dca_classic: {
          strategy_id: "dca_classic",
          display_name: "DCA Classic",
          total_invested: 10000,
          final_value: 10000,
          roi_percent: 0,
          trade_count: 0,
          max_drawdown_percent: null,
          parameters: {},
        },
        simple_regime: {
          strategy_id: "simple_regime",
          display_name: "Simple Regime",
          total_invested: 10000,
          final_value: 10000,
          roi_percent: 0,
          trade_count: 1,
          max_drawdown_percent: null,
          parameters: {},
        },
      },
      timeline: [
        {
          date: "2024-01-01",
          token_price: { btc: 50000 },
          sentiment: 50,
          sentiment_label: "neutral",
          dma_200: 49500,
          strategies: {
            dca_classic: {
              portfolio_value: 10000,
              portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
              event: "buy",
              metrics: { signal: "dca", metadata: {} },
            },
            simple_regime: {
              portfolio_value: 10000,
              portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
              event: "rebalance",
              metrics: {
                signal: "fear",
                metadata: {
                  transfers: [
                    {
                      from_bucket: "spot",
                      to_bucket: "stable",
                      amount_usd: 123,
                    },
                    { from_bucket: "stable", to_bucket: "lp", amount_usd: 456 },
                  ],
                },
              },
            },
          },
        },
      ],
    };

    const { result } = renderHook(() => useBacktestResult(response as any));

    const point = result.current.chartData[0] as any;
    expect(point.sellSpotSignal).toBe(10000);
    expect(point.buyLpSignal).toBe(10000);
    expect(point.buySpotSignal).toBeNull();
    expect(point.sellLpSignal).toBeNull();
    expect(point.dma_200).toBe(49500);

    expect(point.eventStrategies.sell_spot).toContain("Simple Regime");
    expect(point.eventStrategies.buy_lp).toContain("Simple Regime");
  });
});

describe("useBacktestResult interface", () => {
  function createMockResponse(timelineLength = 1) {
    const timeline = Array.from({ length: timelineLength }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, "0")}`,
      token_price: { btc: 50000 },
      sentiment: 50,
      sentiment_label: "neutral" as const,
      dma_200: 49500,
      strategies: {
        dca_classic: {
          portfolio_value: 10000 + i * 100,
          portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
          event: "buy" as const,
          metrics: { signal: "dca" },
        },
        simple_regime: {
          portfolio_value: 10500 + i * 100,
          portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
          event: null,
          metrics: {},
        },
      },
    }));

    return {
      strategies: {
        dca_classic: {
          strategy_id: "dca_classic",
          display_name: "DCA Classic",
          total_invested: 10000,
          final_value: 10000,
          roi_percent: 0,
          trade_count: 0,
          max_drawdown_percent: null,
          parameters: {},
        },
        simple_regime: {
          strategy_id: "simple_regime",
          display_name: "Simple Regime",
          total_invested: 10000,
          final_value: 10500,
          roi_percent: 5,
          trade_count: 1,
          max_drawdown_percent: null,
          parameters: {},
        },
      },
      timeline,
    };
  }

  it("returns empty defaults for null response", () => {
    const { result } = renderHook(() => useBacktestResult(null));
    expect(result.current).toEqual({
      chartData: [],
      yAxisDomain: [0, 1000],
      summary: null,
      sortedStrategyIds: [],
      actualDays: 0,
    });
  });

  it("wraps strategies in summary object", () => {
    const response = createMockResponse(1);
    const { result } = renderHook(() => useBacktestResult(response as any));
    expect(result.current.summary).toEqual({ strategies: response.strategies });
  });

  it("does not expose raw strategyIds", () => {
    const { result } = renderHook(() => useBacktestResult(null));
    expect(result.current).not.toHaveProperty("strategyIds");
  });

  it("sortedStrategyIds places DCA first", () => {
    const response = createMockResponse(1);
    const { result } = renderHook(() => useBacktestResult(response as any));
    expect(result.current.sortedStrategyIds[0]).toBe("dca_classic");
    expect(result.current.sortedStrategyIds).toContain("simple_regime");
  });

  it("actualDays matches timeline span", () => {
    const response = {
      strategies: {
        dca_classic: {
          strategy_id: "dca_classic",
          display_name: "DCA Classic",
          total_invested: 10000,
          final_value: 10000,
          roi_percent: 0,
          trade_count: 0,
          max_drawdown_percent: null,
          parameters: {},
        },
      },
      timeline: [
        {
          date: "2024-01-01",
          token_price: { btc: 50000 },
          sentiment: 50,
          sentiment_label: "neutral" as const,
          dma_200: 49500,
          strategies: {
            dca_classic: {
              portfolio_value: 10000,
              portfolio_constituant: { spot: 5000, stable: 5000, lp: 0 },
              event: "buy" as const,
              metrics: { signal: "dca" },
            },
          },
        },
        {
          date: "2024-01-31",
          token_price: { btc: 51000 },
          sentiment: 55,
          sentiment_label: "neutral" as const,
          dma_200: 49700,
          strategies: {
            dca_classic: {
              portfolio_value: 10200,
              portfolio_constituant: { spot: 5100, stable: 5100, lp: 0 },
              event: null,
              metrics: {},
            },
          },
        },
      ],
    };

    const { result } = renderHook(() => useBacktestResult(response as any));
    expect(result.current.actualDays).toBe(31);
  });

  it("chartData length matches timeline length", () => {
    const response = createMockResponse(3);
    const { result } = renderHook(() => useBacktestResult(response as any));
    expect(result.current.chartData.length).toBe(3);
  });

  it("yAxisDomain is a 2-element tuple", () => {
    const response = createMockResponse(1);
    const { result } = renderHook(() => useBacktestResult(response as any));
    const domain = result.current.yAxisDomain;

    expect(Array.isArray(domain)).toBe(true);
    expect(domain.length).toBe(2);
    expect(typeof domain[0]).toBe("number");
    expect(typeof domain[1]).toBe("number");
    expect(domain[0]).toBeLessThanOrEqual(domain[1]);
  });
});

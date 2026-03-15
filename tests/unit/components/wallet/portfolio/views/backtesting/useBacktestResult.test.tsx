import { describe, expect, it } from "vitest";

import { useBacktestResult } from "@/components/wallet/portfolio/views/backtesting/hooks/useBacktestResult";

import { renderHook } from "../../../../../../test-utils";

function createResponse() {
  return {
    strategies: {
      dca_classic: {
        strategy_id: "dca_classic",
        display_name: "DCA Classic",
        total_invested: 10000,
        final_value: 10000,
        roi_percent: 0,
        trade_count: 0,
        final_allocation: {
          spot: 0.5,
          stable: 0.5,
        },
        parameters: {},
      },
      dma_gated_fgi_default: {
        strategy_id: "dma_gated_fgi",
        display_name: "DMA Gated FGI Default",
        signal_id: "dma_gated_fgi" as const,
        total_invested: 10000,
        final_value: 10500,
        roi_percent: 5,
        trade_count: 1,
        final_allocation: {
          spot: 0.8,
          stable: 0.2,
        },
        parameters: {},
      },
    },
    timeline: [
      {
        market: {
          date: "2024-01-01",
          token_price: { btc: 50000 },
          sentiment: 50,
          sentiment_label: "neutral",
        },
        strategies: {
          dca_classic: {
            portfolio: {
              spot_usd: 5000,
              stable_usd: 5000,
              total_value: 10000,
              allocation: {
                spot: 0.5,
                stable: 0.5,
              },
            },
            signal: null,
            decision: {
              action: "hold" as const,
              reason: "baseline_dca",
              rule_group: "none" as const,
              target_allocation: {
                spot: 0.5,
                stable: 0.5,
              },
              immediate: false,
            },
            execution: {
              event: null,
              transfers: [],
              blocked_reason: null,
              step_count: 0,
              steps_remaining: 0,
              interval_days: 0,
            },
          },
          dma_gated_fgi_default: {
            portfolio: {
              spot_usd: 5000,
              stable_usd: 5000,
              total_value: 10000,
              allocation: {
                spot: 0.5,
                stable: 0.5,
              },
            },
            signal: {
              id: "dma_gated_fgi" as const,
              regime: "fear",
              raw_value: 20,
              confidence: 1,
              details: {
                dma: {
                  dma_200: 49500,
                  distance: 0.01,
                  zone: "above" as const,
                  cross_event: null,
                  cooldown_active: false,
                  cooldown_remaining_days: 0,
                  cooldown_blocked_zone: null,
                  fgi_slope: 1,
                },
              },
            },
            decision: {
              action: "sell" as const,
              reason: "take_profit",
              rule_group: "dma_fgi" as const,
              target_allocation: {
                spot: 0.4,
                stable: 0.6,
              },
              immediate: false,
            },
            execution: {
              event: "rebalance",
              transfers: [
                {
                  from_bucket: "spot" as const,
                  to_bucket: "stable" as const,
                  amount_usd: 123,
                },
              ],
              blocked_reason: null,
              step_count: 1,
              steps_remaining: 0,
              interval_days: 3,
            },
          },
        },
      },
      {
        market: {
          date: "2024-01-31",
          token_price: { btc: 51000 },
          sentiment: 55,
          sentiment_label: "greed",
        },
        strategies: {
          dca_classic: {
            portfolio: {
              spot_usd: 5100,
              stable_usd: 5100,
              total_value: 10200,
              allocation: {
                spot: 0.5,
                stable: 0.5,
              },
            },
            signal: null,
            decision: {
              action: "hold" as const,
              reason: "baseline_dca",
              rule_group: "none" as const,
              target_allocation: {
                spot: 0.5,
                stable: 0.5,
              },
              immediate: false,
            },
            execution: {
              event: null,
              transfers: [],
              blocked_reason: null,
              step_count: 0,
              steps_remaining: 0,
              interval_days: 0,
            },
          },
          dma_gated_fgi_default: {
            portfolio: {
              spot_usd: 8400,
              stable_usd: 2100,
              total_value: 10500,
              allocation: {
                spot: 0.8,
                stable: 0.2,
              },
            },
            signal: {
              id: "dma_gated_fgi" as const,
              regime: "greed",
              raw_value: 75,
              confidence: 1,
              details: {
                dma: {
                  dma_200: 50000,
                  distance: 0.02,
                  zone: "above" as const,
                  cross_event: null,
                  cooldown_active: false,
                  cooldown_remaining_days: 0,
                  cooldown_blocked_zone: null,
                  fgi_slope: 1,
                },
              },
            },
            decision: {
              action: "hold" as const,
              reason: "wait",
              rule_group: "none" as const,
              target_allocation: {
                spot: 0.8,
                stable: 0.2,
              },
              immediate: false,
            },
            execution: {
              event: null,
              transfers: [],
              blocked_reason: null,
              step_count: 0,
              steps_remaining: 0,
              interval_days: 0,
            },
          },
        },
      },
    ],
  };
}

describe("useBacktestResult", () => {
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

  it("builds chart markers from execution transfers", () => {
    const { result } = renderHook(() =>
      useBacktestResult(createResponse() as any)
    );

    const point = result.current.chartData[0] as any;

    expect(point.sellSpotSignal).toBe(10000);
    expect(point.buySpotSignal).toBeNull();
    expect(point.dma_200).toBe(49500);
    expect(point.eventStrategies.sell_spot).toContain("DMA Gated FGI Default");
  });

  it("wraps strategies in a summary object", () => {
    const response = createResponse();
    const { result } = renderHook(() => useBacktestResult(response as any));

    expect(result.current.summary).toEqual({ strategies: response.strategies });
  });

  it("sorts DCA first and keeps the DMA config in the list", () => {
    const { result } = renderHook(() =>
      useBacktestResult(createResponse() as any)
    );

    expect(result.current.sortedStrategyIds[0]).toBe("dca_classic");
    expect(result.current.sortedStrategyIds).toContain("dma_gated_fgi_default");
  });

  it("derives actual days from market.date", () => {
    const { result } = renderHook(() =>
      useBacktestResult(createResponse() as any)
    );

    expect(result.current.actualDays).toBe(31);
  });

  it("keeps chartData length aligned with the timeline length", () => {
    const { result } = renderHook(() =>
      useBacktestResult(createResponse() as any)
    );

    expect(result.current.chartData).toHaveLength(2);
  });

  it("returns a valid y-axis domain tuple", () => {
    const { result } = renderHook(() =>
      useBacktestResult(createResponse() as any)
    );
    const [min, max] = result.current.yAxisDomain;

    expect(typeof min).toBe("number");
    expect(typeof max).toBe("number");
    expect(min).toBeLessThanOrEqual(max);
  });
});

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

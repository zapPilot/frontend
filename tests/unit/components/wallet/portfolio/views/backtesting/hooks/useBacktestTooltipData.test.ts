import { describe, expect, it, vi } from "vitest";

import { useBacktestTooltipData } from "@/components/wallet/portfolio/views/backtesting/hooks/useBacktestTooltipData";

vi.mock("@/utils", () => ({
  formatCurrency: (val: number, opts?: any) =>
    `$${val.toFixed(opts?.minimumFractionDigits ?? 2)}`,
}));

vi.mock(
  "@/components/wallet/portfolio/views/backtesting/utils/strategyDisplay",
  () => ({
    calculatePercentages: (c: any) => {
      const spot =
        typeof c.spot === "number"
          ? c.spot
          : Object.values(c.spot as Record<string, number>).reduce(
              (a: number, b: number) => a + b,
              0
            );
      const lp = typeof c.lp === "number" ? c.lp : 0;
      const total = spot + c.stable + lp;
      if (total === 0) return { spot: 0, stable: 0, lp: 0 };
      return {
        spot: (spot / total) * 100,
        stable: (c.stable / total) * 100,
        lp: (lp / total) * 100,
      };
    },
    getStrategyDisplayName: (id: string) => id.replace(/_/g, " "),
  })
);

describe("useBacktestTooltipData", () => {
  describe("null returns", () => {
    it("returns null for undefined payload", () => {
      const result = useBacktestTooltipData({
        payload: undefined,
        label: "2026-01-01",
      });

      expect(result).toBeNull();
    });

    it("returns null for empty payload array", () => {
      const result = useBacktestTooltipData({
        payload: [],
        label: "2026-01-01",
      });

      expect(result).toBeNull();
    });
  });

  describe("date parsing", () => {
    it("parses date label correctly", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Strategy A",
            value: 100,
            color: "#fff",
            payload: {},
          },
        ],
        label: "2026-01-15",
      });

      expect(result?.dateStr).toBe(new Date("2026-01-15").toLocaleDateString());
    });

    it("handles ISO string timestamp label", () => {
      const isoDate = "2026-02-09T12:00:00.000Z";
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Strategy A",
            value: 100,
            color: "#fff",
            payload: {},
          },
        ],
        label: isoDate,
      });

      expect(result?.dateStr).toBe(new Date(isoDate).toLocaleDateString());
    });
  });

  describe("btcPrice extraction", () => {
    it("extracts btcPrice from token_price.btc", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Strategy A",
            value: 100,
            color: "#fff",
            payload: {
              token_price: { btc: 45000 },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.btcPrice).toBe(45000);
    });

    it("extracts btcPrice from price fallback", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Strategy A",
            value: 100,
            color: "#fff",
            payload: {
              price: 50000,
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.btcPrice).toBe(50000);
    });

    it("prioritizes token_price.btc over price", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Strategy A",
            value: 100,
            color: "#fff",
            payload: {
              token_price: { btc: 45000 },
              price: 50000,
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.btcPrice).toBe(45000);
    });

    it("returns undefined when neither price source exists", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Strategy A",
            value: 100,
            color: "#fff",
            payload: {},
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.btcPrice).toBeUndefined();
    });
  });

  describe("strategy items categorization", () => {
    it("categorizes numeric values as strategy items", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "All Weather",
            value: 12500,
            color: "#ff0000",
            payload: {},
          },
          {
            name: "Risk Parity",
            value: 8500,
            color: "#00ff00",
            payload: {},
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.strategies).toHaveLength(2);
      expect(result?.sections.strategies[0]).toEqual({
        name: "All Weather",
        value: 12500,
        color: "#ff0000",
      });
      expect(result?.sections.strategies[1]).toEqual({
        name: "Risk Parity",
        value: 8500,
        color: "#00ff00",
      });
    });

    it("excludes KNOWN_SIGNALS from strategy items", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Sentiment",
            value: 2,
            color: "#ff0000",
            payload: {},
          },
          {
            name: "VIX",
            value: 25.5,
            color: "#00ff00",
            payload: {},
          },
          {
            name: "Strategy A",
            value: 1000,
            color: "#0000ff",
            payload: {},
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.strategies).toHaveLength(1);
      expect(result?.sections.strategies[0]?.name).toBe("Strategy A");
    });

    it("excludes event signals from strategy items", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Buy Spot",
            value: 1,
            color: "#ff0000",
            payload: {},
          },
          {
            name: "Strategy A",
            value: 1000,
            color: "#0000ff",
            payload: {},
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.strategies).toHaveLength(1);
      expect(result?.sections.strategies[0]?.name).toBe("Strategy A");
    });
  });

  describe("signal items categorization", () => {
    it("categorizes Sentiment signal with label formatting", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Sentiment",
            value: 2,
            color: "#ff0000",
            payload: {
              sentiment_label: "neutral",
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.signals).toHaveLength(1);
      expect(result?.sections.signals[0]).toEqual({
        name: "Sentiment",
        value: "Neutral (2)",
        color: "#ff0000",
      });
    });

    it("handles Sentiment without sentiment_label", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Sentiment",
            value: 2,
            color: "#ff0000",
            payload: {},
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.signals).toHaveLength(1);
      expect(result?.sections.signals[0]?.value).toBe("Unknown (2)");
    });

    it("capitalizes sentiment_label correctly", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Sentiment",
            value: 1,
            color: "#ff0000",
            payload: {
              sentiment_label: "bearish",
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.signals[0]?.value).toBe("Bearish (1)");
    });

    it("categorizes VIX signal with decimal rounding", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "VIX",
            value: 25.5678,
            color: "#00ff00",
            payload: {},
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.signals).toHaveLength(1);
      expect(result?.sections.signals[0]).toEqual({
        name: "VIX",
        value: 25.57,
        color: "#00ff00",
      });
    });

    it("handles VIX rounding edge cases", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "VIX",
            value: 20.004,
            color: "#00ff00",
            payload: {},
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.signals[0]?.value).toBe(20.0);
    });

    it("handles multiple signal items", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Sentiment",
            value: 3,
            color: "#ff0000",
            payload: {
              sentiment_label: "bullish",
            },
          },
          {
            name: "VIX",
            value: 18.33,
            color: "#00ff00",
            payload: {},
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.signals).toHaveLength(2);
      expect(result?.sections.signals[0]?.value).toBe("Bullish (3)");
      expect(result?.sections.signals[1]?.value).toBe(18.33);
    });

    it("categorizes DMA 200 as signal and not strategy", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "DMA 200",
            value: 48765.4321,
            color: "#f59e0b",
            payload: {},
          },
          {
            name: "Strategy A",
            value: 1000,
            color: "#0000ff",
            payload: {},
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.signals).toHaveLength(1);
      expect(result?.sections.signals[0]).toEqual({
        name: "DMA 200",
        value: 48765.43,
        color: "#f59e0b",
      });
      expect(result?.sections.strategies).toHaveLength(1);
      expect(result?.sections.strategies[0]?.name).toBe("Strategy A");
    });
  });

  describe("event items categorization", () => {
    it("categorizes Buy Spot event with strategies", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Buy Spot",
            value: 1,
            color: "#0f0",
            payload: {
              eventStrategies: {
                buy_spot: ["all_weather", "risk_parity"],
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.events).toHaveLength(1);
      expect(result?.sections.events[0]).toEqual({
        name: "Buy Spot",
        strategies: ["all_weather", "risk_parity"],
        color: "#0f0",
      });
    });

    it("categorizes Sell Spot event with strategies", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Sell Spot",
            value: 1,
            color: "#f00",
            payload: {
              eventStrategies: {
                sell_spot: ["momentum"],
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.events).toHaveLength(1);
      expect(result?.sections.events[0]).toEqual({
        name: "Sell Spot",
        strategies: ["momentum"],
        color: "#f00",
      });
    });

    it("categorizes Buy LP event with strategies", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Buy LP",
            value: 1,
            color: "#0ff",
            payload: {
              eventStrategies: {
                buy_lp: ["strategy_a"],
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.events).toHaveLength(1);
      expect(result?.sections.events[0]).toEqual({
        name: "Buy LP",
        strategies: ["strategy_a"],
        color: "#0ff",
      });
    });

    it("categorizes Sell LP event with strategies", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Sell LP",
            value: 1,
            color: "#ff0",
            payload: {
              eventStrategies: {
                sell_lp: ["strategy_b"],
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.events).toHaveLength(1);
      expect(result?.sections.events[0]).toEqual({
        name: "Sell LP",
        strategies: ["strategy_b"],
        color: "#ff0",
      });
    });

    it("handles event with empty strategies array", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Buy Spot",
            value: 1,
            color: "#0f0",
            payload: {
              eventStrategies: {
                buy_spot: [],
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.events).toHaveLength(1);
      expect(result?.sections.events[0]?.strategies).toEqual([]);
    });

    it("handles missing eventStrategies object", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Buy Spot",
            value: 1,
            color: "#0f0",
            payload: {},
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.events).toHaveLength(1);
      expect(result?.sections.events[0]?.strategies).toEqual([]);
    });

    it("handles multiple event items", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Buy Spot",
            value: 1,
            color: "#0f0",
            payload: {
              eventStrategies: {
                buy_spot: ["strategy_a"],
                sell_lp: ["strategy_b"],
              },
            },
          },
          {
            name: "Sell LP",
            value: 1,
            color: "#ff0",
            payload: {
              eventStrategies: {
                buy_spot: ["strategy_a"],
                sell_lp: ["strategy_b"],
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.events).toHaveLength(2);
      expect(result?.sections.events[0]?.name).toBe("Buy Spot");
      expect(result?.sections.events[1]?.name).toBe("Sell LP");
    });
  });

  describe("allocation blocks", () => {
    it("builds allocation blocks from strategy constituents", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "all_weather",
            value: 10000,
            color: "#ff0000",
            payload: {
              strategies: {
                all_weather: {
                  portfolio_constituant: {
                    spot: 5000,
                    stable: 3000,
                    lp: 2000,
                  },
                },
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.allocations).toHaveLength(1);
      expect(result?.sections.allocations[0]).toEqual({
        id: "all_weather",
        displayName: "all weather",
        constituents: {
          spot: 5000,
          stable: 3000,
          lp: 2000,
        },
        spotBreakdown: null,
        index: undefined,
      });
    });

    it("handles spot as Record with breakdown string", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "risk_parity",
            value: 10000,
            color: "#00ff00",
            payload: {
              strategies: {
                risk_parity: {
                  portfolio_constituant: {
                    spot: {
                      btc: 3000,
                      eth: 2000,
                    },
                    stable: 3000,
                    lp: 2000,
                  },
                },
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.allocations).toHaveLength(1);
      expect(result?.sections.allocations[0]?.spotBreakdown).toBe(
        "BTC: $3000, ETH: $2000"
      );
    });

    it("filters out zero values from spot breakdown", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "strategy_a",
            value: 10000,
            color: "#0000ff",
            payload: {
              strategies: {
                strategy_a: {
                  portfolio_constituant: {
                    spot: {
                      btc: 5000,
                      eth: 0,
                      sol: 2000,
                    },
                    stable: 3000,
                    lp: 0,
                  },
                },
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.allocations[0]?.spotBreakdown).toBe(
        "BTC: $5000, SOL: $2000"
      );
    });

    it("returns null spotBreakdown when all spot values are zero", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "strategy_a",
            value: 10000,
            color: "#0000ff",
            payload: {
              strategies: {
                strategy_a: {
                  portfolio_constituant: {
                    spot: {
                      btc: 0,
                      eth: 0,
                    },
                    stable: 10000,
                    lp: 0,
                  },
                },
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.allocations[0]?.spotBreakdown).toBeNull();
    });

    it("filters out allocations with all-zero percentages", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "strategy_a",
            value: 10000,
            color: "#ff0000",
            payload: {
              strategies: {
                strategy_a: {
                  portfolio_constituant: {
                    spot: 5000,
                    stable: 3000,
                    lp: 2000,
                  },
                },
                strategy_b: {
                  portfolio_constituant: {
                    spot: 0,
                    stable: 0,
                    lp: 0,
                  },
                },
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.allocations).toHaveLength(1);
      expect(result?.sections.allocations[0]?.id).toBe("strategy_a");
    });

    it("handles missing portfolio_constituant gracefully", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "strategy_a",
            value: 10000,
            color: "#ff0000",
            payload: {
              strategies: {
                strategy_a: {
                  portfolio_constituant: {
                    spot: 5000,
                    stable: 3000,
                    lp: 2000,
                  },
                },
                strategy_b: {},
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.allocations).toHaveLength(1);
      expect(result?.sections.allocations[0]?.id).toBe("strategy_a");
    });

    it("respects sortedStrategyIds ordering", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "strategy",
            value: 10000,
            color: "#ff0000",
            payload: {
              strategies: {
                strategy_a: {
                  portfolio_constituant: {
                    spot: 1000,
                    stable: 0,
                    lp: 0,
                  },
                },
                strategy_b: {
                  portfolio_constituant: {
                    spot: 2000,
                    stable: 0,
                    lp: 0,
                  },
                },
                strategy_c: {
                  portfolio_constituant: {
                    spot: 3000,
                    stable: 0,
                    lp: 0,
                  },
                },
              },
            },
          },
        ],
        label: "2026-01-01",
        sortedStrategyIds: ["strategy_c", "strategy_a", "strategy_b"],
      });

      expect(result?.sections.allocations).toHaveLength(3);
      expect(result?.sections.allocations[0]?.id).toBe("strategy_c");
      expect(result?.sections.allocations[1]?.id).toBe("strategy_a");
      expect(result?.sections.allocations[2]?.id).toBe("strategy_b");
    });

    it("includes index from sortedStrategyIds", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "strategy",
            value: 10000,
            color: "#ff0000",
            payload: {
              strategies: {
                strategy_a: {
                  portfolio_constituant: {
                    spot: 1000,
                    stable: 0,
                    lp: 0,
                  },
                },
                strategy_b: {
                  portfolio_constituant: {
                    spot: 2000,
                    stable: 0,
                    lp: 0,
                  },
                },
              },
            },
          },
        ],
        label: "2026-01-01",
        sortedStrategyIds: ["strategy_b", "strategy_a"],
      });

      expect(result?.sections.allocations[0]?.index).toBe(0);
      expect(result?.sections.allocations[1]?.index).toBe(1);
    });

    it("handles missing sortedStrategyIds with natural key order", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "strategy",
            value: 10000,
            color: "#ff0000",
            payload: {
              strategies: {
                strategy_c: {
                  portfolio_constituant: {
                    spot: 3000,
                    stable: 0,
                    lp: 0,
                  },
                },
                strategy_a: {
                  portfolio_constituant: {
                    spot: 1000,
                    stable: 0,
                    lp: 0,
                  },
                },
                strategy_b: {
                  portfolio_constituant: {
                    spot: 2000,
                    stable: 0,
                    lp: 0,
                  },
                },
              },
            },
          },
        ],
        label: "2026-01-01",
      });

      // Natural object key order (insertion order)
      expect(result?.sections.allocations).toHaveLength(3);
      expect(result?.sections.allocations[0]?.id).toBe("strategy_c");
      expect(result?.sections.allocations[1]?.id).toBe("strategy_a");
      expect(result?.sections.allocations[2]?.id).toBe("strategy_b");
    });

    it("handles partial sortedStrategyIds coverage", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "strategy",
            value: 10000,
            color: "#ff0000",
            payload: {
              strategies: {
                strategy_a: {
                  portfolio_constituant: {
                    spot: 1000,
                    stable: 0,
                    lp: 0,
                  },
                },
                strategy_b: {
                  portfolio_constituant: {
                    spot: 2000,
                    stable: 0,
                    lp: 0,
                  },
                },
                strategy_c: {
                  portfolio_constituant: {
                    spot: 3000,
                    stable: 0,
                    lp: 0,
                  },
                },
              },
            },
          },
        ],
        label: "2026-01-01",
        sortedStrategyIds: ["strategy_b"],
      });

      // strategy_b first (from sorted), then rest in natural order
      expect(result?.sections.allocations).toHaveLength(3);
      expect(result?.sections.allocations[0]?.id).toBe("strategy_b");
      // strategy_a and strategy_c follow in their natural order
    });

    it("handles sortedStrategyIds with non-existent strategy", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "strategy",
            value: 10000,
            color: "#ff0000",
            payload: {
              strategies: {
                strategy_a: {
                  portfolio_constituant: {
                    spot: 1000,
                    stable: 0,
                    lp: 0,
                  },
                },
                strategy_b: {
                  portfolio_constituant: {
                    spot: 2000,
                    stable: 0,
                    lp: 0,
                  },
                },
              },
            },
          },
        ],
        label: "2026-01-01",
        sortedStrategyIds: ["strategy_c", "strategy_a"],
      });

      // strategy_c doesn't exist, so only strategy_a from sorted, then strategy_b
      expect(result?.sections.allocations).toHaveLength(2);
      expect(result?.sections.allocations[0]?.id).toBe("strategy_a");
      expect(result?.sections.allocations[1]?.id).toBe("strategy_b");
    });
  });

  describe("edge cases", () => {
    it("handles null/undefined entry in payload array", () => {
      const result = useBacktestTooltipData({
        payload: [
          null as any,
          {
            name: "Strategy A",
            value: 1000,
            color: "#ff0000",
            payload: {},
          },
          undefined as any,
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.strategies).toHaveLength(1);
      expect(result?.sections.strategies[0]?.name).toBe("Strategy A");
    });

    it("handles entry with missing name", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            value: 1000,
            color: "#ff0000",
            payload: {},
          } as any,
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.strategies).toHaveLength(1);
      expect(result?.sections.strategies[0]?.name).toBe("");
    });

    it("handles entry with missing color", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Strategy A",
            value: 1000,
            payload: {},
          } as any,
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.strategies[0]?.color).toBe("#fff");
    });

    it("handles entry with non-numeric value", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "Strategy A",
            value: "not a number" as any,
            color: "#ff0000",
            payload: {},
          },
        ],
        label: "2026-01-01",
      });

      expect(result?.sections.strategies).toHaveLength(0);
    });

    it("handles comprehensive mixed payload", () => {
      const result = useBacktestTooltipData({
        payload: [
          {
            name: "all_weather",
            value: 12500,
            color: "#ff0000",
            payload: {
              token_price: { btc: 45000 },
              sentiment_label: "bullish",
              eventStrategies: {
                buy_spot: ["all_weather"],
                sell_lp: ["risk_parity"],
              },
              strategies: {
                all_weather: {
                  portfolio_constituant: {
                    spot: {
                      btc: 5000,
                      eth: 3000,
                    },
                    stable: 3000,
                    lp: 1500,
                  },
                },
                risk_parity: {
                  portfolio_constituant: {
                    spot: 4000,
                    stable: 2000,
                    lp: 2500,
                  },
                },
              },
            },
          },
          {
            name: "risk_parity",
            value: 8500,
            color: "#00ff00",
            payload: {},
          },
          {
            name: "Sentiment",
            value: 3,
            color: "#0000ff",
            payload: {
              sentiment_label: "bullish",
            },
          },
          {
            name: "VIX",
            value: 22.456,
            color: "#ff00ff",
            payload: {},
          },
          {
            name: "Buy Spot",
            value: 1,
            color: "#00ffff",
            payload: {
              eventStrategies: {
                buy_spot: ["all_weather"],
              },
            },
          },
          {
            name: "Sell LP",
            value: 1,
            color: "#ffff00",
            payload: {
              eventStrategies: {
                sell_lp: ["risk_parity"],
              },
            },
          },
        ],
        label: "2026-01-15",
        sortedStrategyIds: ["risk_parity", "all_weather"],
      });

      expect(result).not.toBeNull();
      expect(result?.dateStr).toBe(new Date("2026-01-15").toLocaleDateString());
      expect(result?.btcPrice).toBe(45000);
      expect(result?.sections.strategies).toHaveLength(2);
      expect(result?.sections.signals).toHaveLength(2);
      expect(result?.sections.events).toHaveLength(2);
      expect(result?.sections.allocations).toHaveLength(2);
      expect(result?.sections.allocations[0]?.id).toBe("risk_parity");
      expect(result?.sections.allocations[1]?.id).toBe("all_weather");
    });
  });
});

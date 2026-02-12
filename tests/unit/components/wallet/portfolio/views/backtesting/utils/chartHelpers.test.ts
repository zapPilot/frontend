import { describe, expect, it } from "vitest";

import {
  buildChartPoint,
  calculateActualDays,
  calculateYAxisDomain,
  getPrimaryStrategyId,
  sentimentLabelToIndex,
  sortStrategyIds,
} from "@/components/wallet/portfolio/views/backtesting/utils/chartHelpers";
import type {
  BacktestStrategyPoint,
  BacktestTimelinePoint,
} from "@/types/backtesting";

// --- Test Helpers ---

function createMockTimelinePoint(
  overrides: Partial<BacktestTimelinePoint> = {}
): BacktestTimelinePoint {
  return {
    date: "2024-01-01",
    token_price: { btc: 50000 },
    sentiment: null,
    sentiment_label: null,
    dma_200: null,
    strategies: {},
    ...overrides,
  };
}

function createMockStrategyPoint(
  overrides: Partial<BacktestStrategyPoint> = {}
): BacktestStrategyPoint {
  return {
    portfolio_value: 10000,
    portfolio_constituant: { spot: { btc: 5000 }, stable: 5000, lp: {} },
    event: null,
    metrics: {},
    ...overrides,
  };
}

// --- Tests ---

describe("sentimentLabelToIndex", () => {
  it.each([
    ["extreme_fear", 0],
    ["fear", 1],
    ["neutral", 2],
    ["greed", 3],
    ["extreme_greed", 4],
  ])("maps %s to %i", (label, expected) => {
    expect(sentimentLabelToIndex(label)).toBe(expected);
  });

  it("returns null for null input", () => {
    expect(sentimentLabelToIndex(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(sentimentLabelToIndex(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(sentimentLabelToIndex("")).toBeNull();
  });

  it("returns null for unknown label", () => {
    expect(sentimentLabelToIndex("unknown")).toBeNull();
  });
});

describe("getPrimaryStrategyId", () => {
  it("returns null for empty array", () => {
    expect(getPrimaryStrategyId([])).toBeNull();
  });

  it("skips dca_classic and returns first non-DCA strategy", () => {
    expect(getPrimaryStrategyId(["dca_classic", "simple_regime"])).toBe(
      "simple_regime"
    );
  });

  it("falls back to dca_classic when only DCA present", () => {
    expect(getPrimaryStrategyId(["dca_classic"])).toBe("dca_classic");
  });

  it("returns first strategy when no DCA present", () => {
    expect(getPrimaryStrategyId(["alpha", "beta"])).toBe("alpha");
  });

  it("skips DCA and returns first non-DCA with multiple strategies", () => {
    expect(getPrimaryStrategyId(["dca_classic", "alpha", "beta"])).toBe(
      "alpha"
    );
  });
});

describe("sortStrategyIds", () => {
  it("returns empty array for empty input", () => {
    expect(sortStrategyIds([])).toEqual([]);
  });

  it("returns DCA only when only DCA present", () => {
    expect(sortStrategyIds(["dca_classic"])).toEqual(["dca_classic"]);
  });

  it("places DCA first when DCA and others present", () => {
    expect(sortStrategyIds(["simple_regime", "dca_classic"])).toEqual([
      "dca_classic",
      "simple_regime",
    ]);
  });

  it("sorts by display name when no DCA present", () => {
    expect(sortStrategyIds(["simple_regime", "alpha_strategy"])).toEqual([
      "alpha_strategy",
      "simple_regime",
    ]);
  });

  it("sorts multiple non-DCA strategies alphabetically by display name", () => {
    expect(
      sortStrategyIds(["zebra_strategy", "alpha_beta", "simple_regime"])
    ).toEqual(["alpha_beta", "simple_regime", "zebra_strategy"]);
  });
});

describe("calculateActualDays", () => {
  it("returns 0 for empty timeline", () => {
    expect(calculateActualDays([])).toBe(0);
  });

  it("returns 0 for single point", () => {
    const timeline = [createMockTimelinePoint({ date: "2024-01-01" })];
    expect(calculateActualDays(timeline)).toBe(0);
  });

  it("returns 2 for two points 1 day apart", () => {
    const timeline = [
      createMockTimelinePoint({ date: "2024-01-01" }),
      createMockTimelinePoint({ date: "2024-01-02" }),
    ];
    expect(calculateActualDays(timeline)).toBe(2);
  });

  it("returns 31 for 30-day span", () => {
    const timeline = [
      createMockTimelinePoint({ date: "2024-01-01" }),
      createMockTimelinePoint({ date: "2024-01-31" }),
    ];
    expect(calculateActualDays(timeline)).toBe(31);
  });

  it("returns 1 for same date twice", () => {
    const timeline = [
      createMockTimelinePoint({ date: "2024-01-01" }),
      createMockTimelinePoint({ date: "2024-01-01" }),
    ];
    expect(calculateActualDays(timeline)).toBe(1);
  });
});

describe("calculateYAxisDomain", () => {
  it("returns default domain for empty data", () => {
    expect(calculateYAxisDomain([], [])).toEqual([0, 1000]);
  });

  it("returns same min/max when single point has no padding", () => {
    const data = [{ simple_regime_value: 1000 }];
    expect(calculateYAxisDomain(data, ["simple_regime"])).toEqual([1000, 1000]);
  });

  it("applies 5% padding to min and max with multiple points", () => {
    const data = [{ simple_regime_value: 1000 }, { simple_regime_value: 2000 }];
    const [min, max] = calculateYAxisDomain(data, ["simple_regime"]);
    expect(min).toBe(950); // 1000 - (1000 * 0.05)
    expect(max).toBe(2050); // 2000 + (1000 * 0.05)
  });

  it("calculates domain from multiple strategies", () => {
    const data = [
      { simple_regime_value: 1000, dca_classic_value: 1500 },
      { simple_regime_value: 2000, dca_classic_value: 2500 },
    ];
    const [min, max] = calculateYAxisDomain(data, [
      "simple_regime",
      "dca_classic",
    ]);
    expect(min).toBe(925); // 1000 - (1500 * 0.05)
    expect(max).toBe(2575); // 2500 + (1500 * 0.05)
  });

  it("includes signal field values in domain calculation", () => {
    const data = [
      { simple_regime_value: 1000, buySpotSignal: 500 },
      { simple_regime_value: 2000, sellSpotSignal: 2200 },
    ];
    const [min, max] = calculateYAxisDomain(data, ["simple_regime"]);
    expect(min).toBe(415); // 500 - (1700 * 0.05)
    expect(max).toBe(2285); // 2200 + (1700 * 0.05)
  });

  it("never returns negative min", () => {
    const data = [{ simple_regime_value: 1 }, { simple_regime_value: 100 }];
    const [min] = calculateYAxisDomain(data, ["simple_regime"]);
    expect(min).toBe(0); // Math.max(0, 1 - 4.95) where padding = 99 * 0.05 = 4.95
  });

  it("returns default domain when no matching strategy keys found", () => {
    const data = [{ unrelated_value: 1000 }];
    expect(calculateYAxisDomain(data, ["simple_regime"])).toEqual([0, 1000]);
  });
});

describe("buildChartPoint", () => {
  it("sets strategy_value for each strategy from portfolio_value", () => {
    const point = createMockTimelinePoint({
      strategies: {
        simple_regime: createMockStrategyPoint({ portfolio_value: 12000 }),
        dca_classic: createMockStrategyPoint({ portfolio_value: 10500 }),
      },
    });

    const result = buildChartPoint(point, ["simple_regime", "dca_classic"]);

    expect(result["simple_regime_value"]).toBe(12000);
    expect(result["dca_classic_value"]).toBe(10500);
  });

  it("sets sentiment from point.sentiment when present", () => {
    const point = createMockTimelinePoint({ sentiment: 3 });
    const result = buildChartPoint(point, []);

    expect(result["sentiment"]).toBe(3);
  });

  it("falls back to sentimentLabelToIndex when sentiment is null but label exists", () => {
    const point = createMockTimelinePoint({
      sentiment: null,
      sentiment_label: "fear",
    });
    const result = buildChartPoint(point, []);

    expect(result["sentiment"]).toBe(1);
  });

  it("sets dma_200 from point.dma_200", () => {
    const point = createMockTimelinePoint({ dma_200: 48000 });
    const result = buildChartPoint(point, []);

    expect(result["dma_200"]).toBe(48000);
  });

  it("sets all signal fields to null when no transfers and no borrow events", () => {
    const point = createMockTimelinePoint({
      strategies: {
        simple_regime: createMockStrategyPoint({
          metrics: {},
        }),
      },
    });

    const result = buildChartPoint(point, ["simple_regime"]);

    expect(result["buySpotSignal"]).toBeNull();
    expect(result["sellSpotSignal"]).toBeNull();
    expect(result["buyLpSignal"]).toBeNull();
    expect(result["sellLpSignal"]).toBeNull();
    expect(result["borrowSignal"]).toBeNull();
    expect(result["repaySignal"]).toBeNull();
    expect(result["liquidateSignal"]).toBeNull();
  });

  it("detects sell_spot from spot to stable transfer", () => {
    const point = createMockTimelinePoint({
      strategies: {
        simple_regime: createMockStrategyPoint({
          portfolio_value: 12000,
          metrics: {
            signal: "fear",
            metadata: {
              transfers: [
                { from_bucket: "spot", to_bucket: "stable", amount_usd: 100 },
              ],
            },
          },
        }),
      },
    });

    const result = buildChartPoint(point, ["simple_regime"]);

    expect(result["sellSpotSignal"]).toBe(12000);
  });

  it("detects buy_spot from stable to spot transfer", () => {
    const point = createMockTimelinePoint({
      strategies: {
        simple_regime: createMockStrategyPoint({
          portfolio_value: 11000,
          metrics: {
            signal: "greed",
            metadata: {
              transfers: [
                { from_bucket: "stable", to_bucket: "spot", amount_usd: 200 },
              ],
            },
          },
        }),
      },
    });

    const result = buildChartPoint(point, ["simple_regime"]);

    expect(result["buySpotSignal"]).toBe(11000);
  });

  it("detects buy_lp from stable to lp transfer", () => {
    const point = createMockTimelinePoint({
      strategies: {
        simple_regime: createMockStrategyPoint({
          portfolio_value: 13000,
          metrics: {
            metadata: {
              transfers: [
                { from_bucket: "stable", to_bucket: "lp", amount_usd: 500 },
              ],
            },
          },
        }),
      },
    });

    const result = buildChartPoint(point, ["simple_regime"]);

    expect(result["buyLpSignal"]).toBe(13000);
  });

  it("detects sell_lp from lp to stable transfer", () => {
    const point = createMockTimelinePoint({
      strategies: {
        simple_regime: createMockStrategyPoint({
          portfolio_value: 9500,
          metrics: {
            metadata: {
              transfers: [
                { from_bucket: "lp", to_bucket: "stable", amount_usd: 300 },
              ],
            },
          },
        }),
      },
    });

    const result = buildChartPoint(point, ["simple_regime"]);

    expect(result["sellLpSignal"]).toBe(9500);
  });

  it("populates eventStrategies with display names for triggered signals", () => {
    const point = createMockTimelinePoint({
      strategies: {
        simple_regime: createMockStrategyPoint({
          portfolio_value: 12000,
          metrics: {
            metadata: {
              transfers: [
                { from_bucket: "spot", to_bucket: "stable", amount_usd: 100 },
              ],
            },
          },
        }),
      },
    });

    const result = buildChartPoint(point, ["simple_regime"]);
    const eventStrategies = result["eventStrategies"] as Record<
      string,
      string[]
    >;

    expect(eventStrategies["sell_spot"]).toEqual(["Simple Regime"]);
  });

  it("ignores DCA baseline signals", () => {
    const point = createMockTimelinePoint({
      strategies: {
        dca_classic: createMockStrategyPoint({
          portfolio_value: 10000,
          metrics: {
            signal: "dca",
            metadata: {
              transfers: [
                { from_bucket: "stable", to_bucket: "spot", amount_usd: 100 },
              ],
            },
          },
        }),
      },
    });

    const result = buildChartPoint(point, ["dca_classic"]);

    expect(result["buySpotSignal"]).toBeNull();
    expect(result["sellSpotSignal"]).toBeNull();
    expect(result["buyLpSignal"]).toBeNull();
    expect(result["sellLpSignal"]).toBeNull();
  });

  it("handles borrow event", () => {
    const point = createMockTimelinePoint({
      strategies: {
        simple_regime: createMockStrategyPoint({
          portfolio_value: 15000,
          metrics: {
            borrow_event: "borrow",
          },
        }),
      },
    });

    const result = buildChartPoint(point, ["simple_regime"]);

    expect(result["borrowSignal"]).toBe(15000);
  });

  it("handles repay event", () => {
    const point = createMockTimelinePoint({
      strategies: {
        simple_regime: createMockStrategyPoint({
          portfolio_value: 14000,
          metrics: {
            borrow_event: "repay",
          },
        }),
      },
    });

    const result = buildChartPoint(point, ["simple_regime"]);

    expect(result["repaySignal"]).toBe(14000);
  });

  it("handles liquidate event", () => {
    const point = createMockTimelinePoint({
      strategies: {
        simple_regime: createMockStrategyPoint({
          portfolio_value: 8000,
          metrics: {
            borrow_event: "liquidate",
          },
        }),
      },
    });

    const result = buildChartPoint(point, ["simple_regime"]);

    expect(result["liquidateSignal"]).toBe(8000);
  });

  it("uses max portfolio_value when multiple strategies trigger same signal type", () => {
    const point = createMockTimelinePoint({
      strategies: {
        simple_regime: createMockStrategyPoint({
          portfolio_value: 12000,
          metrics: {
            metadata: {
              transfers: [
                { from_bucket: "stable", to_bucket: "spot", amount_usd: 100 },
              ],
            },
          },
        }),
        alpha_strategy: createMockStrategyPoint({
          portfolio_value: 15000,
          metrics: {
            metadata: {
              transfers: [
                { from_bucket: "stable", to_bucket: "spot", amount_usd: 200 },
              ],
            },
          },
        }),
      },
    });

    const result = buildChartPoint(point, ["simple_regime", "alpha_strategy"]);

    expect(result["buySpotSignal"]).toBe(15000);
  });
});

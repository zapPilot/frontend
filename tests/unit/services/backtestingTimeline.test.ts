import {
  enrichTimelineWithDma200,
  MAX_CHART_POINTS,
  MIN_CHART_POINTS,
  sampleTimelineData,
} from "@/services/backtestingTimeline";
import type { BacktestTimelinePoint } from "@/types/backtesting";

describe("backtestingTimeline", () => {
  describe("enrichTimelineWithDma200", () => {
    it("should return empty array for undefined timeline", () => {
      expect(enrichTimelineWithDma200(undefined)).toEqual([]);
    });

    it("should return empty array for empty timeline", () => {
      expect(enrichTimelineWithDma200([])).toEqual([]);
    });

    it("should set dma_200 to null when price is null", () => {
      const timeline: BacktestTimelinePoint[] = [
        {
          date: "2024-01-01",
          token_price: {},
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        },
      ];

      const result = enrichTimelineWithDma200(timeline);
      expect(result[0]?.dma_200).toBeNull();
    });

    it("should set dma_200 to null when token_price is empty", () => {
      const timeline: BacktestTimelinePoint[] = [
        {
          date: "2024-01-01",
          token_price: {},
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        },
      ];

      const result = enrichTimelineWithDma200(timeline);
      expect(result[0]?.dma_200).toBeNull();
    });

    it("should use btc price when available", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 + i * 100, eth: 3000 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })
      );

      const result = enrichTimelineWithDma200(timeline);
      const lastPoint = result[result.length - 1];
      expect(lastPoint?.dma_200).toBeGreaterThan(50000);
    });

    it("should fallback to first available numeric price when btc is missing", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { eth: 3000 + i * 10 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })
      );

      const result = enrichTimelineWithDma200(timeline);
      const lastPoint = result[result.length - 1];
      expect(lastPoint?.dma_200).toBeGreaterThan(3000);
    });

    it("should reset window when encountering null price", () => {
      const timeline: BacktestTimelinePoint[] = [
        ...Array.from({ length: 100 }, (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })),
        {
          date: "2024-01-101",
          token_price: {},
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        },
        ...Array.from({ length: 100 }, (_, i) => ({
          date: `2024-01-${String(i + 102).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })),
      ];

      const result = enrichTimelineWithDma200(timeline);
      expect(result[100]?.dma_200).toBeNull();
      expect(result[101]?.dma_200).toBeNull();
    });

    it("should calculate dma_200 only after 200 data points", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 250 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })
      );

      const result = enrichTimelineWithDma200(timeline);
      expect(result[198]?.dma_200).toBeNull();
      expect(result[199]?.dma_200).toBe(50000);
      expect(result[200]?.dma_200).toBe(50000);
    });

    it("should maintain rolling window correctly", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 250 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 + i },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })
      );

      const result = enrichTimelineWithDma200(timeline);
      const dma200At249 = result[249]?.dma_200;
      expect(dma200At249).toBeDefined();
      expect(dma200At249).toBeGreaterThan(50000);
    });

    it("should handle non-finite btc prices", () => {
      const timeline: BacktestTimelinePoint[] = [
        {
          date: "2024-01-01",
          token_price: { btc: Infinity },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        },
      ];

      const result = enrichTimelineWithDma200(timeline);
      expect(result[0]?.dma_200).toBeNull();
    });

    it("should handle non-finite fallback prices", () => {
      const timeline: BacktestTimelinePoint[] = [
        {
          date: "2024-01-01",
          token_price: { eth: NaN },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        },
      ];

      const result = enrichTimelineWithDma200(timeline);
      expect(result[0]?.dma_200).toBeNull();
    });

    it("should handle mixed valid and invalid prices in token_price object", () => {
      const timeline: BacktestTimelinePoint[] = [
        {
          date: "2024-01-01",
          token_price: { invalid: "not-a-number", eth: 3000 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        },
      ];

      const result = enrichTimelineWithDma200(timeline);
      expect(result[0]?.dma_200).toBeNull();
    });
  });

  describe("sampleTimelineData", () => {
    it("should return empty array for undefined timeline", () => {
      expect(sampleTimelineData(undefined)).toEqual([]);
    });

    it("should return empty array for empty timeline", () => {
      expect(sampleTimelineData([])).toEqual([]);
    });

    it("should return original timeline if length <= minPoints", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 50 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result).toEqual(timeline);
    });

    it("should preserve first and last points", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result[0]).toEqual(timeline[0]);
      expect(result[result.length - 1]).toEqual(timeline[timeline.length - 1]);
    });

    it("should preserve points with trading events", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies:
            i === 50
              ? {
                  strategy1: {
                    portfolio_value: 50000,
                    portfolio_constituant: { spot: {}, stable: 0, lp: {} },
                    event: "buy",
                    metrics: {},
                  },
                }
              : {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result.some(point => point.date === "2024-01-51")).toBe(true);
    });

    it("should skip dca_classic strategy events", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies:
            i === 50
              ? {
                  dca_classic: {
                    portfolio_value: 50000,
                    portfolio_constituant: { spot: {}, stable: 0, lp: {} },
                    event: "buy",
                    metrics: { signal: "dca" },
                  },
                }
              : {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result.length).toBeLessThanOrEqual(MIN_CHART_POINTS);
    });

    it("should preserve points with transfers", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies:
            i === 75
              ? {
                  strategy1: {
                    portfolio_value: 50000,
                    portfolio_constituant: { spot: {}, stable: 0, lp: {} },
                    event: null,
                    metrics: {
                      metadata: {
                        transfers: [
                          {
                            from_bucket: "spot",
                            to_bucket: "stable",
                            amount_usd: 1000,
                          },
                        ],
                      },
                    },
                  },
                }
              : {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result.some(point => point.date === "2024-01-76")).toBe(true);
    });

    it("should handle timeline with length <= effectiveMax but > minPoints", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 100 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result.length).toBeGreaterThanOrEqual(MIN_CHART_POINTS);
      expect(result[0]).toEqual(timeline[0]);
      expect(result[result.length - 1]).toEqual(timeline[timeline.length - 1]);
    });

    it("should handle case when remainingSlots <= 0", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies:
            i % 2 === 0
              ? {
                  strategy1: {
                    portfolio_value: 50000,
                    portfolio_constituant: { spot: {}, stable: 0, lp: {} },
                    event: "buy",
                    metrics: {},
                  },
                }
              : {},
        })
      );

      const result = sampleTimelineData(timeline, MIN_CHART_POINTS);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(MAX_CHART_POINTS);
    });

    it("should sample non-critical points evenly", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result.length).toBeGreaterThanOrEqual(MIN_CHART_POINTS);
      expect(result.length).toBeLessThanOrEqual(MAX_CHART_POINTS);
    });

    it("should handle invalid transfers gracefully", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies:
            i === 50
              ? {
                  strategy1: {
                    portfolio_value: 50000,
                    portfolio_constituant: { spot: {}, stable: 0, lp: {} },
                    event: null,
                    metrics: {
                      metadata: {
                        transfers: [
                          {
                            from_bucket: "invalid",
                            to_bucket: "stable",
                            amount_usd: 1000,
                          },
                        ],
                      },
                    },
                  },
                }
              : {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle non-array transfers", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies:
            i === 50
              ? {
                  strategy1: {
                    portfolio_value: 50000,
                    portfolio_constituant: { spot: {}, stable: 0, lp: {} },
                    event: null,
                    metrics: {
                      metadata: {
                        transfers: "not-an-array",
                      },
                    },
                  },
                }
              : {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle strategy with both event and transfers", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies:
            i === 100
              ? {
                  strategy1: {
                    portfolio_value: 50000,
                    portfolio_constituant: { spot: {}, stable: 0, lp: {} },
                    event: "rebalance",
                    metrics: {
                      metadata: {
                        transfers: [
                          {
                            from_bucket: "spot",
                            to_bucket: "lp",
                            amount_usd: 5000,
                          },
                        ],
                      },
                    },
                  },
                }
              : {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result.some(point => point.date === "2024-01-101")).toBe(true);
    });

    it("should respect custom minPoints parameter", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })
      );

      const result = sampleTimelineData(timeline, 50);
      expect(result.length).toBeGreaterThanOrEqual(50);
    });

    it("should handle multiple strategies with mixed dca and non-dca", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies:
            i === 50
              ? {
                  dca_classic: {
                    portfolio_value: 50000,
                    portfolio_constituant: { spot: {}, stable: 0, lp: {} },
                    event: "buy",
                    metrics: { signal: "dca" },
                  },
                  simple_regime: {
                    portfolio_value: 50000,
                    portfolio_constituant: { spot: {}, stable: 0, lp: {} },
                    event: "sell",
                    metrics: {},
                  },
                }
              : {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result.some(point => point.date === "2024-01-51")).toBe(true);
    });

    it("should filter out undefined points after mapping", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies: {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result.every(point => point !== undefined)).toBe(true);
    });

    it("should dynamically expand point limit for event-heavy timelines", () => {
      const timeline: BacktestTimelinePoint[] = Array.from(
        { length: 200 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, "0")}`,
          token_price: { btc: 50000 },
          sentiment: null,
          sentiment_label: null,
          strategies:
            i % 10 === 0
              ? {
                  strategy1: {
                    portfolio_value: 50000,
                    portfolio_constituant: { spot: {}, stable: 0, lp: {} },
                    event: "buy",
                    metrics: {},
                  },
                }
              : {},
        })
      );

      const result = sampleTimelineData(timeline);
      expect(result.length).toBeGreaterThanOrEqual(MIN_CHART_POINTS);
    });
  });
});

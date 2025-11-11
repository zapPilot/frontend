import { describe, expect, it, vi } from "vitest";

import { buildAllocationHistory } from "../../../src/components/PortfolioChart/";

vi.mock("../../../src/contexts/UserContext", () => ({
  useUser: () => ({ userInfo: null }),
}));

const CLOSE_PRECISION = 3;

describe("buildAllocationHistory", () => {
  it("maps API allocation data with explicit percentages", () => {
    const rawPoints = [
      {
        date: "2025-08-08",
        category: "stablecoins",
        percentage: 12.56,
      },
      {
        date: "2025-08-08",
        category: "others",
        percentage: 87.44,
      },
    ];

    const result = buildAllocationHistory(rawPoints);

    expect(result).toHaveLength(1);
    const [point] = result;
    expect(point.date).toBe("2025-08-08");
    expect(point.btc).toBeCloseTo(0, CLOSE_PRECISION);
    expect(point.eth).toBeCloseTo(0, CLOSE_PRECISION);
    expect(point.stablecoin).toBeCloseTo(12.56, CLOSE_PRECISION);
    expect(point.altcoin).toBeCloseTo(87.44, CLOSE_PRECISION);
    const total = point.btc + point.eth + point.stablecoin + point.altcoin;
    expect(total).toBeCloseTo(100, CLOSE_PRECISION);
  });

  it("derives percentages when only category values are provided", () => {
    const rawPoints = [
      {
        date: "2025-08-09",
        category: "BTC",
        category_value: 40000,
        total_value: 100000,
      },
      {
        date: "2025-08-09",
        category: "ETH",
        category_value: 60000,
        total_value: 100000,
      },
    ];

    const result = buildAllocationHistory(rawPoints);

    expect(result).toHaveLength(1);
    const [point] = result;
    expect(point.btc).toBeCloseTo(40, CLOSE_PRECISION);
    expect(point.eth).toBeCloseTo(60, CLOSE_PRECISION);
    expect(point.stablecoin + point.altcoin).toBeCloseTo(0, CLOSE_PRECISION);
  });

  it("returns empty allocation history when no API points are available", () => {
    const result = buildAllocationHistory([]);

    expect(result).toHaveLength(0);
  });

  describe("Debt Position Handling", () => {
    it("should exclude negative category values (debt positions)", () => {
      const rawPoints = [
        {
          date: "2025-01-15",
          category: "BTC",
          category_value_usd: 10000,
          total_portfolio_value_usd: 5000, // Net worth after debt
        },
        {
          date: "2025-01-15",
          category: "stablecoins",
          category_value_usd: -5000, // DEBT
          total_portfolio_value_usd: 5000,
        },
      ];

      const result = buildAllocationHistory(rawPoints);

      expect(result).toHaveLength(1);
      const [point] = result;

      // Only BTC should be counted, normalized to 100%
      expect(point.btc).toBeCloseTo(100, CLOSE_PRECISION);
      expect(point.stablecoin).toBeCloseTo(0, CLOSE_PRECISION);

      // Total should be 100%
      const total = point.btc + point.eth + point.stablecoin + point.altcoin;
      expect(total).toBeCloseTo(100, CLOSE_PRECISION);
    });

    it("should exclude negative allocation percentages", () => {
      const rawPoints = [
        {
          date: "2025-01-15",
          category: "BTC",
          allocation_percentage: 60,
        },
        {
          date: "2025-01-15",
          category: "ETH",
          allocation_percentage: 40,
        },
        {
          date: "2025-01-15",
          category: "stablecoins",
          allocation_percentage: -20, // DEBT
        },
      ];

      const result = buildAllocationHistory(rawPoints);

      expect(result).toHaveLength(1);
      const [point] = result;

      // Only positive allocations counted, normalized to 100%
      expect(point.btc).toBeCloseTo(60, CLOSE_PRECISION);
      expect(point.eth).toBeCloseTo(40, CLOSE_PRECISION);
      expect(point.stablecoin).toBeCloseTo(0, CLOSE_PRECISION);

      const total = point.btc + point.eth + point.stablecoin + point.altcoin;
      expect(total).toBeCloseTo(100, CLOSE_PRECISION);
    });

    it("should handle mixed positive and negative allocations correctly", () => {
      const rawPoints = [
        {
          date: "2025-01-15",
          category: "BTC",
          category_value_usd: 15000,
          total_portfolio_value_usd: 10000, // Net worth
        },
        {
          date: "2025-01-15",
          category: "ETH",
          category_value_usd: 10000,
          total_portfolio_value_usd: 10000,
        },
        {
          date: "2025-01-15",
          category: "stablecoins",
          category_value_usd: -15000, // Leveraged debt
          total_portfolio_value_usd: 10000,
        },
      ];

      const result = buildAllocationHistory(rawPoints);

      expect(result).toHaveLength(1);
      const [point] = result;

      // Only long positions counted
      // BTC: 15000, ETH: 10000 → 60% BTC, 40% ETH
      expect(point.btc).toBeCloseTo(60, CLOSE_PRECISION);
      expect(point.eth).toBeCloseTo(40, CLOSE_PRECISION);
      expect(point.stablecoin).toBeCloseTo(0, CLOSE_PRECISION);

      const total = point.btc + point.eth + point.stablecoin + point.altcoin;
      expect(total).toBeCloseTo(100, CLOSE_PRECISION);
    });

    it("should handle edge case: all categories have debt", () => {
      const rawPoints = [
        {
          date: "2025-01-15",
          category: "BTC",
          category_value_usd: -1000,
          total_portfolio_value_usd: -4000,
        },
        {
          date: "2025-01-15",
          category: "ETH",
          category_value_usd: -500,
          total_portfolio_value_usd: -4000,
        },
        {
          date: "2025-01-15",
          category: "stablecoins",
          category_value_usd: -2000,
          total_portfolio_value_usd: -4000,
        },
        {
          date: "2025-01-15",
          category: "others",
          category_value_usd: -500,
          total_portfolio_value_usd: -4000,
        },
      ];

      const result = buildAllocationHistory(rawPoints);

      expect(result).toHaveLength(1);
      const [point] = result;

      // All negative values filtered out → all zeros
      expect(point.btc).toBe(0);
      expect(point.eth).toBe(0);
      expect(point.stablecoin).toBe(0);
      expect(point.altcoin).toBe(0);
    });

    it("should handle zero allocation after filtering debt", () => {
      const rawPoints = [
        {
          date: "2025-01-15",
          category: "stablecoins",
          category_value_usd: -5000,
          total_portfolio_value_usd: -5000,
        },
      ];

      const result = buildAllocationHistory(rawPoints);

      expect(result).toHaveLength(1);
      const [point] = result;

      // Only debt, so everything zeros out
      expect(point.btc).toBe(0);
      expect(point.eth).toBe(0);
      expect(point.stablecoin).toBe(0);
      expect(point.altcoin).toBe(0);
    });

    it("should handle tiny positive values after filtering large debt", () => {
      const rawPoints = [
        {
          date: "2025-01-15",
          category: "BTC",
          category_value_usd: 100,
          total_portfolio_value_usd: 150, // Net after debt
        },
        {
          date: "2025-01-15",
          category: "ETH",
          category_value_usd: 50,
          total_portfolio_value_usd: 150,
        },
        {
          date: "2025-01-15",
          category: "stablecoins",
          category_value_usd: -10000, // Large debt, but filtered
          total_portfolio_value_usd: 150,
        },
      ];

      const result = buildAllocationHistory(rawPoints);

      expect(result).toHaveLength(1);
      const [point] = result;

      // Small values still normalize correctly: 100/(100+50) = 66.67%, 50/150 = 33.33%
      expect(point.btc).toBeCloseTo(66.67, 1);
      expect(point.eth).toBeCloseTo(33.33, 1);
      expect(point.stablecoin).toBeCloseTo(0, CLOSE_PRECISION);

      const total = point.btc + point.eth + point.stablecoin + point.altcoin;
      expect(total).toBeCloseTo(100, CLOSE_PRECISION);
    });
  });
});

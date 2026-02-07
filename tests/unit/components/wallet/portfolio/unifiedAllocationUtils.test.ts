import { describe, expect, it } from "vitest";

import {
  calculateTotalPercentage,
  getAllocationSummary,
  mapBacktestToUnified,
  mapLegacyConstituentsToUnified,
  mapPortfolioToUnified,
  mapStrategyToUnified,
} from "@/components/wallet/portfolio/components/allocation/unifiedAllocationUtils";
import { UNIFIED_COLORS } from "@/constants/assets";

describe("unifiedAllocationUtils", () => {
  // ─────────────────────────────────────────────────────────────────────────
  // mapPortfolioToUnified
  // ─────────────────────────────────────────────────────────────────────────

  describe("mapPortfolioToUnified", () => {
    it("maps portfolio allocation to unified segments", () => {
      const result = mapPortfolioToUnified({
        btc: 40,
        eth: 30,
        others: 10,
        stablecoins: 20,
      });

      expect(result).toHaveLength(3); // btc, alt (eth+others), stable
      expect(result.find(s => s.category === "btc")?.percentage).toBe(40);
      expect(result.find(s => s.category === "alt")?.percentage).toBe(40); // 30+10
      expect(result.find(s => s.category === "stable")?.percentage).toBe(20);
    });

    it("filters out zero-value segments", () => {
      const result = mapPortfolioToUnified({
        btc: 100,
        eth: 0,
        others: 0,
        stablecoins: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("btc");
    });

    it("sorts segments by percentage descending", () => {
      const result = mapPortfolioToUnified({
        btc: 10,
        eth: 5,
        others: 25, // Combined with eth = 30% ALT
        stablecoins: 60,
      });

      // 60% stable > 30% alt > 10% btc
      expect(result[0].category).toBe("stable");
      expect(result[1].category).toBe("alt");
      expect(result[2].category).toBe("btc");
    });

    it("returns empty array for all zeros", () => {
      const result = mapPortfolioToUnified({
        btc: 0,
        eth: 0,
        others: 0,
        stablecoins: 0,
      });

      expect(result).toHaveLength(0);
    });

    it("uses correct colors", () => {
      const result = mapPortfolioToUnified({
        btc: 50,
        eth: 25,
        others: 0,
        stablecoins: 25,
      });

      expect(result.find(s => s.category === "btc")?.color).toBe(
        UNIFIED_COLORS.BTC
      );
      expect(result.find(s => s.category === "stable")?.color).toBe(
        UNIFIED_COLORS.STABLE
      );
      expect(result.find(s => s.category === "alt")?.color).toBe(
        UNIFIED_COLORS.ALT
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // mapStrategyToUnified
  // ─────────────────────────────────────────────────────────────────────────

  describe("mapStrategyToUnified", () => {
    it("maps strategy buckets to unified segments", () => {
      const result = mapStrategyToUnified({
        spot: 0.5,
        lp: 0.3,
        stable: 0.2,
      });

      expect(result).toHaveLength(3);
      expect(result.find(s => s.category === "btc")?.percentage).toBe(50);
      expect(result.find(s => s.category === "btc-stable")?.percentage).toBe(
        30
      );
      expect(result.find(s => s.category === "stable")?.percentage).toBe(20);
    });

    it("converts ratios to percentages", () => {
      const result = mapStrategyToUnified({
        spot: 0.75,
        lp: 0.25,
        stable: 0,
      });

      expect(result.find(s => s.category === "btc")?.percentage).toBe(75);
      expect(result.find(s => s.category === "btc-stable")?.percentage).toBe(
        25
      );
    });

    it("filters zero values", () => {
      const result = mapStrategyToUnified({
        spot: 1.0,
        lp: 0,
        stable: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("btc");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // mapBacktestToUnified
  // ─────────────────────────────────────────────────────────────────────────

  describe("mapBacktestToUnified", () => {
    it("maps backtest constituents with record breakdown", () => {
      const result = mapBacktestToUnified({
        spot: { btc: 3000, eth: 2000 },
        lp: { btc: 1000, eth: 500 },
        stable: 3500,
      });

      // Total = 3000 + 2000 + 1000 + 500 + 3500 = 10000
      expect(result.find(s => s.category === "btc")?.percentage).toBeCloseTo(
        30 // 3000/10000 = 30%
      );
      expect(
        result.find(s => s.category === "btc-stable")?.percentage
      ).toBeCloseTo(10); // 1000/10000 = 10%
      expect(result.find(s => s.category === "stable")?.percentage).toBeCloseTo(
        35
      );
      expect(result.find(s => s.category === "alt")?.percentage).toBeCloseTo(
        25 // eth spot (2000) + eth lp (500) = 2500/10000 = 25%
      );
    });

    it("handles plain number spot/lp values", () => {
      const result = mapBacktestToUnified({
        spot: 5000,
        lp: 2000,
        stable: 3000,
      });

      // When spot/lp are numbers, they go to "others" → ALT
      // Total = 5000 + 2000 + 3000 = 10000
      expect(result.find(s => s.category === "stable")?.percentage).toBe(30);
      // spot + lp → alt (since no btc/eth breakdown)
      expect(result.find(s => s.category === "alt")?.percentage).toBe(70);
    });

    it("returns empty array for zero total", () => {
      const result = mapBacktestToUnified({
        spot: 0,
        lp: 0,
        stable: 0,
      });

      expect(result).toHaveLength(0);
    });

    it("correctly categorizes BTC-LP as btc-stable", () => {
      const result = mapBacktestToUnified({
        spot: { btc: 5000 },
        lp: { btc: 3000 }, // BTC-USDC LP
        stable: 2000,
      });

      expect(result.find(s => s.category === "btc-stable")).toBeDefined();
      expect(
        result.find(s => s.category === "btc-stable")?.percentage
      ).toBeCloseTo(30);
    });

    it("categorizes ETH and ETH-LP as ALT", () => {
      const result = mapBacktestToUnified({
        spot: { eth: 4000 },
        lp: { eth: 2000 }, // ETH-USDC LP
        stable: 4000,
      });

      expect(result.find(s => s.category === "alt")?.percentage).toBeCloseTo(
        60 // eth spot + eth lp
      );
      expect(result.find(s => s.category === "btc")).toBeUndefined(); // no BTC
      expect(result.find(s => s.category === "btc-stable")).toBeUndefined(); // no BTC-LP
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // mapLegacyConstituentsToUnified
  // ─────────────────────────────────────────────────────────────────────────

  describe("mapLegacyConstituentsToUnified", () => {
    it("maps legacy constituents to unified segments", () => {
      const result = mapLegacyConstituentsToUnified(
        [
          { symbol: "BTC", value: 50, color: "#F7931A" },
          { symbol: "ETH", value: 30, color: "#627EEA" },
        ],
        20
      );

      expect(result.find(s => s.category === "btc")?.percentage).toBe(50);
      expect(result.find(s => s.category === "alt")?.percentage).toBe(30);
      expect(result.find(s => s.category === "stable")?.percentage).toBe(20);
    });

    it("categorizes WBTC and cbBTC as BTC", () => {
      const result = mapLegacyConstituentsToUnified(
        [
          { symbol: "WBTC", value: 30, color: "#F7931A" },
          { symbol: "cbBTC", value: 20, color: "#F7931A" },
        ],
        50
      );

      expect(result.find(s => s.category === "btc")?.percentage).toBe(50); // 30 + 20
    });

    it("handles empty crypto assets", () => {
      const result = mapLegacyConstituentsToUnified([], 100);

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("stable");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Helper Functions
  // ─────────────────────────────────────────────────────────────────────────

  describe("calculateTotalPercentage", () => {
    it("calculates total correctly", () => {
      const segments = mapPortfolioToUnified({
        btc: 40,
        eth: 30,
        others: 10,
        stablecoins: 20,
      });

      expect(calculateTotalPercentage(segments)).toBe(100);
    });
  });

  describe("getAllocationSummary", () => {
    it("returns human-readable summary", () => {
      const segments = mapPortfolioToUnified({
        btc: 50,
        eth: 25,
        others: 0,
        stablecoins: 25,
      });

      const summary = getAllocationSummary(segments);
      expect(summary).toContain("BTC 50%");
      expect(summary).toContain("STABLE 25%");
      expect(summary).toContain("ALT 25%");
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  calculatePercentages,
  getStrategyColor,
  getStrategyDisplayName,
} from "@/components/wallet/portfolio/views/backtesting/utils/strategyDisplay";

describe("strategyDisplay", () => {
  describe("getStrategyDisplayName", () => {
    it("returns display name for DCA Classic strategy", () => {
      expect(getStrategyDisplayName("dca_classic")).toBe("DCA Classic");
    });

    it("returns display name for Simple Regime strategy", () => {
      expect(getStrategyDisplayName("simple_regime")).toBe("Simple Regime");
    });

    it("formats unknown strategy IDs by replacing underscores with spaces", () => {
      expect(getStrategyDisplayName("custom_strategy_v2")).toBe(
        "custom strategy v2"
      );
      expect(getStrategyDisplayName("some_other_strategy")).toBe(
        "some other strategy"
      );
    });

    it("returns strategy ID as-is if no underscores present", () => {
      expect(getStrategyDisplayName("customstrategy")).toBe("customstrategy");
    });
  });

  describe("getStrategyColor", () => {
    it("returns DCA Classic color for exact DCA Classic strategy ID", () => {
      expect(getStrategyColor("dca_classic")).toBe("#4b5563");
    });

    it("returns DCA Classic color for strategy IDs containing DCA Classic", () => {
      expect(getStrategyColor("dca_classic_v2")).toBe("#4b5563");
      expect(getStrategyColor("modified_dca_classic")).toBe("#4b5563");
    });

    it("returns color from palette by index when index provided", () => {
      expect(getStrategyColor("any_strategy", 0)).toBe("#3b82f6");
      expect(getStrategyColor("another_strategy", 1)).toBe("#06b6d4");
      expect(getStrategyColor("third_strategy", 2)).toBe("#8b5cf6");
    });

    it("wraps around palette when index exceeds palette length", () => {
      // Palette has 13 colors, so index 13 should wrap to 0
      expect(getStrategyColor("strategy_a", 13)).toBe("#3b82f6");
      expect(getStrategyColor("strategy_b", 14)).toBe("#06b6d4");
      expect(getStrategyColor("strategy_c", 26)).toBe("#3b82f6");
    });

    it("uses hash-based color selection when no index provided", () => {
      // Test that the same strategy ID always returns the same color
      const color1 = getStrategyColor("simple_regime");
      const color2 = getStrategyColor("simple_regime");
      expect(color1).toBe(color2);

      // Different strategies should potentially get different colors
      const colorA = getStrategyColor("strategy_alpha");
      const colorB = getStrategyColor("strategy_beta");
      // Both should be valid palette colors
      expect(colorA).toMatch(/^#[0-9a-f]{6}$/);
      expect(colorB).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("handles empty string strategy ID with hash fallback", () => {
      const color = getStrategyColor("");
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("returns consistent hash-based colors for various strategy IDs", () => {
      // Test determinism of hash function
      const strategies = [
        "momentum_v1",
        "mean_reversion",
        "trend_following",
        "arbitrage_bot",
      ];

      for (const strategy of strategies) {
        const color1 = getStrategyColor(strategy);
        const color2 = getStrategyColor(strategy);
        expect(color1).toBe(color2);
        expect(color1).toMatch(/^#[0-9a-f]{6}$/);
      }
    });
  });

  describe("calculatePercentages", () => {
    it("calculates percentages for single-value constituents", () => {
      const result = calculatePercentages({
        spot: 500,
        stable: 300,
        lp: 200,
      });

      expect(result.spot).toBeCloseTo(50);
      expect(result.stable).toBeCloseTo(30);
      expect(result.lp).toBeCloseTo(20);
    });

    it("calculates percentages for multi-token spot values", () => {
      const result = calculatePercentages({
        spot: { BTC: 300, ETH: 200 },
        stable: 300,
        lp: 200,
      });

      expect(result.spot).toBeCloseTo(50);
      expect(result.stable).toBeCloseTo(30);
      expect(result.lp).toBeCloseTo(20);
    });

    it("calculates percentages for multi-token lp values", () => {
      const result = calculatePercentages({
        spot: 400,
        stable: 300,
        lp: { "BTC-USDC": 150, "ETH-USDC": 150 },
      });

      expect(result.spot).toBeCloseTo(40);
      expect(result.stable).toBeCloseTo(30);
      expect(result.lp).toBeCloseTo(30);
    });

    it("calculates percentages for both multi-token spot and lp", () => {
      const result = calculatePercentages({
        spot: { BTC: 200, ETH: 200 },
        stable: 200,
        lp: { "BTC-USDC": 200, "ETH-USDC": 200 },
      });

      expect(result.spot).toBeCloseTo(40);
      expect(result.stable).toBeCloseTo(20);
      expect(result.lp).toBeCloseTo(40);
    });

    it("returns zeros when total is zero", () => {
      const result = calculatePercentages({
        spot: 0,
        stable: 0,
        lp: 0,
      });

      expect(result.spot).toBe(0);
      expect(result.stable).toBe(0);
      expect(result.lp).toBe(0);
    });

    it("handles zero values in multi-token records", () => {
      const result = calculatePercentages({
        spot: { BTC: 0, ETH: 0 },
        stable: 0,
        lp: { "BTC-USDC": 0 },
      });

      expect(result.spot).toBe(0);
      expect(result.stable).toBe(0);
      expect(result.lp).toBe(0);
    });

    it("handles mixed zero and non-zero values", () => {
      const result = calculatePercentages({
        spot: 0,
        stable: 500,
        lp: 500,
      });

      expect(result.spot).toBe(0);
      expect(result.stable).toBeCloseTo(50);
      expect(result.lp).toBeCloseTo(50);
    });

    it("handles empty multi-token records", () => {
      const result = calculatePercentages({
        spot: {},
        stable: 1000,
        lp: {},
      });

      expect(result.spot).toBe(0);
      expect(result.stable).toBe(100);
      expect(result.lp).toBe(0);
    });

    it("sums multiple tokens correctly in complex scenario", () => {
      const result = calculatePercentages({
        spot: { BTC: 100, ETH: 100, SOL: 100 },
        stable: 100,
        lp: { "BTC-USDC": 50, "ETH-USDC": 50, "SOL-USDC": 100 },
      });

      // Total: 300 (spot) + 100 (stable) + 200 (lp) = 600
      expect(result.spot).toBeCloseTo(50);
      expect(result.stable).toBeCloseTo(100 / 6);
      expect(result.lp).toBeCloseTo(200 / 6);
    });

    it("handles invalid input types gracefully by treating them as 0", () => {
      const result = calculatePercentages({
        spot: null as unknown as number,
        stable: 1000,
        lp: undefined as unknown as number,
      });

      // Invalid spot/lp values should be treated as 0
      expect(result.spot).toBe(0);
      expect(result.stable).toBe(100);
      expect(result.lp).toBe(0);
    });
  });
});

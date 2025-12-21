/**
 * Tests for portfolio.utils.ts
 *
 * Tests for category transformation and pool categorization utilities
 */

import { describe, expect, it } from "vitest";

import {
  categorizePool,
  transformPortfolioCategories,
} from "@/utils/portfolio.utils";

describe("portfolio.utils", () => {
  describe("categorizePool", () => {
    it("categorizes BTC-related symbols", () => {
      expect(categorizePool(["wbtc", "usdc"])).toBe("btc");
      expect(categorizePool(["WBTC"])).toBe("btc");
      expect(categorizePool(["cbbtc", "eth"])).toBe("btc");
    });

    it("categorizes ETH-related symbols", () => {
      expect(categorizePool(["weth", "usdc"])).toBe("eth");
      expect(categorizePool(["WETH"])).toBe("eth");
      expect(categorizePool(["steth", "dai"])).toBe("eth");
    });

    it("categorizes stablecoin symbols", () => {
      expect(categorizePool(["usdc", "usdt"])).toBe("stablecoins");
      expect(categorizePool(["DAI"])).toBe("stablecoins");
      expect(categorizePool(["usdc"])).toBe("stablecoins");
    });

    it("returns 'others' for unknown symbols", () => {
      expect(categorizePool(["unknown", "token"])).toBe("others");
      expect(categorizePool(["xyz"])).toBe("others");
      expect(categorizePool([])).toBe("others");
    });

    it("prioritizes BTC over ETH over stablecoins", () => {
      // BTC takes precedence
      expect(categorizePool(["wbtc", "weth", "usdc"])).toBe("btc");
      // ETH takes precedence over stablecoins
      expect(categorizePool(["weth", "usdc"])).toBe("eth");
    });
  });

  describe("transformPortfolioCategories", () => {
    it("transforms empty categories array", () => {
      const result = transformPortfolioCategories([]);
      expect(result.summaries).toEqual([]);
      expect(result.pieChartData).toEqual([]);
    });

    it("filters out categories with zero value", () => {
      const categories = [
        { id: "btc" as const, value: 100 },
        { id: "eth" as const, value: 0 },
        { id: "stablecoins" as const, value: 50 },
      ];
      const result = transformPortfolioCategories(categories);

      expect(result.summaries).toHaveLength(2);
      expect(result.summaries.map(s => s.id)).toContain("btc");
      expect(result.summaries.map(s => s.id)).toContain("stablecoins");
      expect(result.summaries.map(s => s.id)).not.toContain("eth");
    });

    it("calculates percentages correctly", () => {
      const categories = [
        { id: "btc" as const, value: 100 },
        { id: "eth" as const, value: 100 },
      ];
      const result = transformPortfolioCategories(categories);

      expect(result.summaries[0].percentage).toBe(50);
      expect(result.summaries[1].percentage).toBe(50);
    });

    it("uses provided percentage when available", () => {
      const categories = [
        { id: "btc" as const, value: 100, percentage: 75 },
        { id: "eth" as const, value: 100, percentage: 25 },
      ];
      const result = transformPortfolioCategories(categories);

      const btcSummary = result.summaries.find(s => s.id === "btc");
      const ethSummary = result.summaries.find(s => s.id === "eth");
      expect(btcSummary?.percentage).toBe(75);
      expect(ethSummary?.percentage).toBe(25);
    });

    it("uses provided totalValue for percentage calculation", () => {
      const categories = [{ id: "btc" as const, value: 200 }];
      const result = transformPortfolioCategories(categories, {
        totalValue: 1000,
      });

      expect(result.summaries[0].percentage).toBe(20);
    });

    it("sorts summaries by totalValue descending", () => {
      const categories = [
        { id: "btc" as const, value: 100 },
        { id: "eth" as const, value: 300 },
        { id: "stablecoins" as const, value: 200 },
      ];
      const result = transformPortfolioCategories(categories);

      expect(result.summaries[0].id).toBe("eth");
      expect(result.summaries[1].id).toBe("stablecoins");
      expect(result.summaries[2].id).toBe("btc");
    });

    it("respects colorVariant option", () => {
      const categories = [{ id: "btc" as const, value: 100 }];

      const brandResult = transformPortfolioCategories(categories, {
        colorVariant: "brand",
      });
      const chartResult = transformPortfolioCategories(categories, {
        colorVariant: "chart",
      });

      // Both should work without error and have color properties
      expect(brandResult.summaries[0].color).toBeDefined();
      expect(chartResult.summaries[0].color).toBeDefined();
    });

    it("generates pieChartData alongside summaries", () => {
      const categories = [
        { id: "btc" as const, value: 100 },
        { id: "eth" as const, value: 100 },
      ];
      const result = transformPortfolioCategories(categories);

      expect(result.pieChartData).toHaveLength(2);
      expect(result.pieChartData[0]).toHaveProperty("value");
      expect(result.pieChartData[0]).toHaveProperty("label");
    });
  });
});

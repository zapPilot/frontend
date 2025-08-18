import { describe, expect, it } from "vitest";
import type { AssetCategory } from "../../../src/types/portfolio";
import {
  separateAssetsAndBorrowing,
  transformForDisplay,
  formatBorrowingAmount,
  getBorrowingPercentage,
  hasSignificantBorrowing,
} from "../../../src/utils/borrowingUtils";

describe("borrowingUtils", () => {
  const mockAssetCategories: AssetCategory[] = [
    {
      id: "stablecoin",
      name: "Stablecoin",
      color: "#22c55e",
      totalValue: 5000,
      percentage: 50,
      change24h: 1.2,
      assets: [],
    },
    {
      id: "defi",
      name: "DeFi",
      color: "#8b5cf6",
      totalValue: 3000,
      percentage: 30,
      change24h: -2.1,
      assets: [],
    },
    {
      id: "borrowed-eth",
      name: "ETH Borrowed",
      color: "#ef4444",
      totalValue: -2000, // Negative value = borrowed
      percentage: -20,
      change24h: 0,
      assets: [],
    },
  ];

  describe("separateAssetsAndBorrowing", () => {
    it("should separate positive and negative value categories", () => {
      const result = separateAssetsAndBorrowing(mockAssetCategories);

      expect(result.assets).toHaveLength(2);
      expect(result.borrowing).toHaveLength(1);
      expect(result.totalAssets).toBe(8000); // 5000 + 3000
      expect(result.totalBorrowing).toBe(2000); // abs(-2000)
      expect(result.netValue).toBe(6000); // 8000 - 2000
    });

    it("should recalculate percentages for assets based on total assets", () => {
      const result = separateAssetsAndBorrowing(mockAssetCategories);

      expect(result.assets[0].percentage).toBe(62.5); // 5000/8000 * 100
      expect(result.assets[1].percentage).toBe(37.5); // 3000/8000 * 100
    });

    it("should make borrowing values positive for display", () => {
      const result = separateAssetsAndBorrowing(mockAssetCategories);

      expect(result.borrowing[0].totalValue).toBe(2000); // Made positive
      expect(result.borrowing[0].percentage).toBe(20); // Made positive
    });
  });

  describe("transformForDisplay", () => {
    it("should create proper borrowing display data", () => {
      const result = transformForDisplay(mockAssetCategories);

      expect(result.assetsPieData).toHaveLength(2);
      expect(result.borrowingItems).toHaveLength(1);
      expect(result.netValue).toBe(6000);
      expect(result.totalBorrowing).toBe(2000);
      expect(result.hasBorrowing).toBe(true);
    });

    it("should handle empty categories", () => {
      const result = transformForDisplay([]);

      expect(result.assetsPieData).toHaveLength(0);
      expect(result.borrowingItems).toHaveLength(0);
      expect(result.netValue).toBe(0);
      expect(result.totalBorrowing).toBe(0);
      expect(result.hasBorrowing).toBe(false);
    });
  });

  describe("formatBorrowingAmount", () => {
    it("should format positive numbers with minus sign", () => {
      expect(formatBorrowingAmount(1000)).toBe("-$1,000");
    });

    it("should format negative numbers with minus sign", () => {
      expect(formatBorrowingAmount(-1000)).toBe("-$1,000");
    });
  });

  describe("getBorrowingPercentage", () => {
    it("should calculate borrowing percentage correctly", () => {
      expect(getBorrowingPercentage(2000, 10000)).toBe(20);
    });

    it("should handle zero total value", () => {
      expect(getBorrowingPercentage(1000, 0)).toBe(0);
    });
  });

  describe("hasSignificantBorrowing", () => {
    it("should return true for significant borrowing", () => {
      expect(hasSignificantBorrowing(500, 10000)).toBe(true); // 5% > 1% threshold
    });

    it("should return false for insignificant borrowing", () => {
      expect(hasSignificantBorrowing(50, 10000)).toBe(false); // 0.5% < 1% threshold
    });

    it("should handle zero assets", () => {
      expect(hasSignificantBorrowing(1000, 0)).toBe(false);
    });
  });
});

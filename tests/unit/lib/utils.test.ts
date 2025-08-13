import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  getRiskLevelClasses,
  getChangeColorClasses,
  calculatePortfolioMetrics,
} from "../../../src/lib/utils";

describe("utils", () => {
  describe("formatCurrency", () => {
    it("should format currency correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
      expect(formatCurrency(0)).toBe("$0.00");
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
    });

    it("should hide currency when isHidden is true", () => {
      expect(formatCurrency(1234.56, true)).toBe("••••••••");
    });
  });

  describe("formatNumber", () => {
    it("should format numbers correctly", () => {
      expect(formatNumber(1234.56)).toBe("1,234.56");
      expect(formatNumber(0)).toBe("0");
      expect(formatNumber(1000000)).toBe("1,000,000");
    });

    it("should hide numbers when isHidden is true", () => {
      expect(formatNumber(1234.56, true)).toBe("••••");
    });

    it("should handle decimal places correctly", () => {
      expect(formatNumber(1.123456)).toBe("1.1235");
      expect(formatNumber(1.1)).toBe("1.1");
    });
  });

  describe("formatPercentage", () => {
    it("should format positive percentages with + sign", () => {
      expect(formatPercentage(5.678)).toBe("+5.7%");
      expect(formatPercentage(0.1)).toBe("+0.1%");
    });

    it("should format negative percentages without + sign", () => {
      expect(formatPercentage(-3.456)).toBe("-3.5%");
      expect(formatPercentage(-0.1)).toBe("-0.1%");
    });

    it("should format zero percentage with + sign", () => {
      expect(formatPercentage(0)).toBe("+0.0%");
    });
  });

  describe("getRiskLevelClasses", () => {
    it("should return correct classes for Low risk", () => {
      expect(getRiskLevelClasses("Low")).toBe("bg-green-900/30 text-green-400");
    });

    it("should return correct classes for Medium risk", () => {
      expect(getRiskLevelClasses("Medium")).toBe(
        "bg-yellow-900/30 text-yellow-400"
      );
    });

    it("should return correct classes for High risk", () => {
      expect(getRiskLevelClasses("High")).toBe("bg-red-900/30 text-red-400");
    });

    it("should return default classes for unknown risk", () => {
      expect(getRiskLevelClasses("Unknown")).toBe(
        "bg-gray-900/30 text-gray-400"
      );
      expect(getRiskLevelClasses("")).toBe("bg-gray-900/30 text-gray-400");
    });
  });

  describe("getChangeColorClasses", () => {
    it("should return green classes for positive values", () => {
      expect(getChangeColorClasses(5)).toBe("text-green-400");
      expect(getChangeColorClasses(0.1)).toBe("text-green-400");
      expect(getChangeColorClasses(0)).toBe("text-green-400");
    });

    it("should return red classes for negative values", () => {
      expect(getChangeColorClasses(-5)).toBe("text-red-400");
      expect(getChangeColorClasses(-0.1)).toBe("text-red-400");
    });
  });

  describe("calculatePortfolioMetrics", () => {
    it("should calculate metrics correctly for multiple categories", () => {
      const categories = [
        { totalValue: 1000, change24h: 5 }, // +50
        { totalValue: 2000, change24h: -2 }, // -40
        { totalValue: 500, change24h: 10 }, // +50
      ];

      const result = calculatePortfolioMetrics(categories);

      expect(result.totalValue).toBe(3500);
      expect(result.totalChange24h).toBe(60); // 50 - 40 + 50
      expect(result.totalChangePercentage).toBeCloseTo(1.71, 1); // (60/3500) * 100
    });

    it("should handle empty categories array", () => {
      const result = calculatePortfolioMetrics([]);

      expect(result.totalValue).toBe(0);
      expect(result.totalChange24h).toBe(0);
      expect(result.totalChangePercentage).toBe(0);
    });

    it("should handle zero total value", () => {
      const categories = [{ totalValue: 0, change24h: 5 }];

      const result = calculatePortfolioMetrics(categories);

      expect(result.totalValue).toBe(0);
      expect(result.totalChange24h).toBe(0);
      expect(result.totalChangePercentage).toBe(0);
    });

    it("should handle negative changes correctly", () => {
      const categories = [
        { totalValue: 1000, change24h: -10 }, // -100
      ];

      const result = calculatePortfolioMetrics(categories);

      expect(result.totalValue).toBe(1000);
      expect(result.totalChange24h).toBe(-100);
      expect(result.totalChangePercentage).toBe(-10);
    });
  });
});

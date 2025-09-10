import { describe, it, expect } from "vitest";
import {
  formatSharpeRatio,
  getSharpeRatioInterpretation,
  formatAnnualReturn,
} from "../../../../src/utils/risk/riskFormatting";

describe("Sharpe Ratio Formatting Utilities", () => {
  describe("formatSharpeRatio", () => {
    it("should format positive Sharpe ratio with default 2 decimals", () => {
      expect(formatSharpeRatio(2.419)).toBe("2.42");
      expect(formatSharpeRatio(0.856)).toBe("0.86");
      expect(formatSharpeRatio(1.5)).toBe("1.50");
    });

    it("should format negative Sharpe ratio", () => {
      expect(formatSharpeRatio(-0.234)).toBe("-0.23");
      expect(formatSharpeRatio(-1.5)).toBe("-1.50");
    });

    it("should format zero Sharpe ratio", () => {
      expect(formatSharpeRatio(0)).toBe("0.00");
    });

    it("should respect custom decimal places", () => {
      expect(formatSharpeRatio(2.419, 0)).toBe("2");
      expect(formatSharpeRatio(2.419, 1)).toBe("2.4");
      expect(formatSharpeRatio(2.419, 3)).toBe("2.419");
    });

    it("should handle very large and small numbers", () => {
      expect(formatSharpeRatio(999.999)).toBe("1000.00");
      expect(formatSharpeRatio(0.001)).toBe("0.00");
      expect(formatSharpeRatio(0.009)).toBe("0.01");
    });
  });

  describe("getSharpeRatioInterpretation", () => {
    it("should classify poor Sharpe ratios (< 0)", () => {
      const result = getSharpeRatioInterpretation(-0.5);
      expect(result.text).toBe("Poor");
      expect(result.colorClass).toBe("text-red-400");
    });

    it("should classify acceptable Sharpe ratios (0 to 1)", () => {
      const result1 = getSharpeRatioInterpretation(0);
      expect(result1.text).toBe("Acceptable");
      expect(result1.colorClass).toBe("text-yellow-400");

      const result2 = getSharpeRatioInterpretation(0.75);
      expect(result2.text).toBe("Acceptable");
      expect(result2.colorClass).toBe("text-yellow-400");

      const result3 = getSharpeRatioInterpretation(0.999);
      expect(result3.text).toBe("Acceptable");
      expect(result3.colorClass).toBe("text-yellow-400");
    });

    it("should classify good Sharpe ratios (1 to 2)", () => {
      const result1 = getSharpeRatioInterpretation(1);
      expect(result1.text).toBe("Good");
      expect(result1.colorClass).toBe("text-green-400");

      const result2 = getSharpeRatioInterpretation(1.5);
      expect(result2.text).toBe("Good");
      expect(result2.colorClass).toBe("text-green-400");

      const result3 = getSharpeRatioInterpretation(1.999);
      expect(result3.text).toBe("Good");
      expect(result3.colorClass).toBe("text-green-400");
    });

    it("should classify very good Sharpe ratios (2 to 3)", () => {
      const result1 = getSharpeRatioInterpretation(2);
      expect(result1.text).toBe("Very Good");
      expect(result1.colorClass).toBe("text-blue-400");

      const result2 = getSharpeRatioInterpretation(2.42);
      expect(result2.text).toBe("Very Good");
      expect(result2.colorClass).toBe("text-blue-400");

      const result3 = getSharpeRatioInterpretation(2.999);
      expect(result3.text).toBe("Very Good");
      expect(result3.colorClass).toBe("text-blue-400");
    });

    it("should classify exceptional Sharpe ratios (≥ 3)", () => {
      const result1 = getSharpeRatioInterpretation(3);
      expect(result1.text).toBe("Exceptional");
      expect(result1.colorClass).toBe("text-purple-400");

      const result2 = getSharpeRatioInterpretation(5.5);
      expect(result2.text).toBe("Exceptional");
      expect(result2.colorClass).toBe("text-purple-400");
    });

    it("should handle boundary values correctly", () => {
      // Test exact boundary values
      expect(getSharpeRatioInterpretation(0).text).toBe("Acceptable");
      expect(getSharpeRatioInterpretation(1).text).toBe("Good");
      expect(getSharpeRatioInterpretation(2).text).toBe("Very Good");
      expect(getSharpeRatioInterpretation(3).text).toBe("Exceptional");
    });
  });

  describe("formatAnnualReturn", () => {
    it("should format positive returns with default 1 decimal", () => {
      expect(formatAnnualReturn(0.03819)).toBe("+3.8%");
      expect(formatAnnualReturn(0.182)).toBe("+18.2%");
      expect(formatAnnualReturn(0.05)).toBe("+5.0%");
    });

    it("should format negative returns", () => {
      expect(formatAnnualReturn(-0.0534)).toBe("-5.3%");
      expect(formatAnnualReturn(-0.1)).toBe("-10.0%");
      expect(formatAnnualReturn(-0.005)).toBe("-0.5%");
    });

    it("should format zero return", () => {
      expect(formatAnnualReturn(0)).toBe("+0.0%");
    });

    it("should respect custom decimal places", () => {
      expect(formatAnnualReturn(0.182, 0)).toBe("+18%");
      expect(formatAnnualReturn(0.182, 2)).toBe("+18.20%");
      expect(formatAnnualReturn(0.182, 3)).toBe("+18.200%");
    });

    it("should handle very small positive and negative returns", () => {
      expect(formatAnnualReturn(0.001)).toBe("+0.1%");
      expect(formatAnnualReturn(-0.001)).toBe("-0.1%");
      expect(formatAnnualReturn(0.0001)).toBe("+0.0%");
    });

    it("should handle large returns", () => {
      expect(formatAnnualReturn(1.5)).toBe("+150.0%");
      expect(formatAnnualReturn(-0.95)).toBe("-95.0%");
    });

    it("should maintain sign consistency", () => {
      // Positive values should always have + sign
      expect(formatAnnualReturn(0.1).startsWith("+")).toBe(true);
      expect(formatAnnualReturn(0.001).startsWith("+")).toBe(true);

      // Negative values should have - sign
      expect(formatAnnualReturn(-0.1).startsWith("-")).toBe(true);
      expect(formatAnnualReturn(-0.001).startsWith("-")).toBe(true);

      // Zero should have + sign
      expect(formatAnnualReturn(0).startsWith("+")).toBe(true);
    });
  });
});

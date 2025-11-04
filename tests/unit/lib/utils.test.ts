import { describe, expect, it } from "vitest";

import { getChangeColorClasses } from "../../../src/lib/color-utils";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "../../../src/lib/formatters";

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
});

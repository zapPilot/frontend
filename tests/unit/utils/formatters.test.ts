/**
 * formatters - Unit Tests
 *
 * Tests for formatting utilities (currency, numbers, addresses, dates).
 */

import { describe, expect, it } from "vitest";

import {
  formatAddress,
  formatChartDate,
  formatCurrency,
  formatNumber,
  formatters,
} from "@/utils/formatters";

describe("formatCurrency", () => {
  describe("Basic formatting", () => {
    it("should format positive amounts", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("should format negative amounts", () => {
      expect(formatCurrency(-500)).toBe("-$500.00");
    });

    it("should format zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("should format large amounts", () => {
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
    });
  });

  describe("Hidden placeholder", () => {
    it("should return placeholder when isHidden is true (legacy boolean)", () => {
      const result = formatCurrency(1234, true);
      expect(result).toBe("••••••••");
    });

    it("should return placeholder when options.isHidden is true", () => {
      const result = formatCurrency(1234, { isHidden: true });
      expect(result).toBe("••••••••");
    });
  });

  describe("Custom options", () => {
    it("should respect minimumFractionDigits", () => {
      const result = formatCurrency(100, { minimumFractionDigits: 0 });
      expect(result).toBe("$100");
    });

    it("should respect maximumFractionDigits", () => {
      const result = formatCurrency(100.99, { maximumFractionDigits: 2 });
      expect(result).toBe("$100.99");
    });
  });

  describe("Smart precision mode", () => {
    it("should return $0.00 for zero amount", () => {
      const result = formatCurrency(0, { smartPrecision: true });
      expect(result).toBe("$0.00");
    });

    it("should show '< $0.01' for very small positive amounts", () => {
      const result = formatCurrency(0.005, { smartPrecision: true });
      expect(result).toBe("< $0.01");
    });

    it("should format small negative amounts", () => {
      const result = formatCurrency(-0.005, {
        smartPrecision: true,
        showNegative: true,
      });
      expect(result).toBe("-< $0.01");
    });

    it("should format amounts above threshold normally", () => {
      const result = formatCurrency(5.5, { smartPrecision: true });
      expect(result).toBe("$5.50");
    });

    it("should respect custom threshold", () => {
      const result = formatCurrency(0.0005, {
        smartPrecision: true,
        threshold: 0.001,
      });
      expect(result).toBe("< $0.0010");
    });
  });
});

describe("formatNumber", () => {
  describe("Basic formatting", () => {
    it("should format integers", () => {
      expect(formatNumber(1234)).toBe("1,234");
    });

    it("should format decimals", () => {
      expect(formatNumber(1234.5678)).toBe("1,234.5678");
    });
  });

  describe("Hidden placeholder", () => {
    it("should return placeholder when isHidden is true (legacy)", () => {
      const result = formatNumber(1234, true);
      expect(result).toBe("••••");
    });

    it("should return placeholder when options.isHidden is true", () => {
      const result = formatNumber(1234, { isHidden: true });
      expect(result).toBe("••••");
    });
  });

  describe("Smart precision mode", () => {
    it("should return '0' for zero", () => {
      expect(formatNumber(0, { smartPrecision: true })).toBe("0");
    });

    it("should return '< 0.000001' for very tiny values", () => {
      expect(formatNumber(0.0000001, { smartPrecision: true })).toBe(
        "< 0.000001"
      );
    });

    it("should format tiny values with 6 decimals", () => {
      expect(formatNumber(0.005, { smartPrecision: true })).toBe("0.005000");
    });

    it("should format small values with 4 decimals", () => {
      expect(formatNumber(0.5, { smartPrecision: true })).toBe("0.5000");
    });

    it("should format medium values with 2 decimals", () => {
      expect(formatNumber(50, { smartPrecision: true })).toBe("50.00");
    });

    it("should format large values with 0 decimals", () => {
      expect(formatNumber(150, { smartPrecision: true })).toBe("150");
    });
  });

  describe("Custom options", () => {
    it("should respect maximumFractionDigits", () => {
      const result = formatNumber(1.23456, { maximumFractionDigits: 2 });
      expect(result).toBe("1.23");
    });
  });
});

describe("formatAddress", () => {
  it("should shorten long addresses", () => {
    const result = formatAddress("0x1234567890abcdef1234567890abcdef12345678");
    expect(result).toBe("0x1234...5678");
  });

  it("should return empty string for null", () => {
    expect(formatAddress(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(formatAddress(undefined)).toBe("");
  });

  it("should return empty string for empty string input", () => {
    expect(formatAddress("")).toBe("");
  });

  it("should return empty string for whitespace-only input", () => {
    expect(formatAddress("   ")).toBe("");
  });

  it("should return short address unchanged", () => {
    expect(formatAddress("0x1234")).toBe("0x1234");
  });

  it("should respect custom prefix/suffix lengths", () => {
    const result = formatAddress("0x1234567890abcdef1234567890abcdef12345678", {
      prefixLength: 10,
      suffixLength: 8,
    });
    expect(result).toBe("0x12345678...12345678");
  });

  it("should respect custom ellipsis", () => {
    const result = formatAddress("0x1234567890abcdef1234567890abcdef12345678", {
      ellipsis: "…",
    });
    expect(result).toBe("0x1234…5678");
  });
});

describe("formatChartDate", () => {
  it("should format date string", () => {
    const result = formatChartDate("2024-01-15");
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it("should format Date object", () => {
    const result = formatChartDate(new Date("2024-06-20"));
    expect(result).toMatch(/Jun 20, 2024/);
  });

  it("should return original string for invalid date string", () => {
    expect(formatChartDate("invalid")).toBe("invalid");
  });

  it("should return empty string for invalid Date object", () => {
    expect(formatChartDate(new Date("invalid"))).toBe("");
  });
});

describe("formatters object", () => {
  it("should format currency rounded to dollars", () => {
    expect(formatters.currency(1234.56)).toBe("$1,235");
  });

  it("should format percentage", () => {
    expect(formatters.percent(25.5)).toBe("25.5%");
    expect(formatters.percent(10, 2)).toBe("10.00%");
  });

  it("should have chartDate alias", () => {
    expect(formatters.chartDate).toBe(formatChartDate);
  });

  it("should have number alias", () => {
    expect(formatters.number).toBe(formatNumber);
  });
});

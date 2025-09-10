/**
 * Tests for Risk Formatting Utilities
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  formatDateRange,
  formatDate,
  formatPercentage,
  formatCurrency,
  formatNumberWithAbbreviation,
  getRelativeTimeDescription,
} from "../../../../src/utils/risk/riskFormatting";

// Mock Date to ensure consistent test results
const mockDate = new Date("2024-06-15T10:30:00Z");

describe("formatDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats date range correctly", () => {
    const result = formatDateRange("2024-01-01", "2024-12-31");
    expect(result).toBe("Jan 1, 2024 - Dec 31, 2024");
  });

  it("handles same year dates", () => {
    const result = formatDateRange("2024-03-15", "2024-08-20");
    expect(result).toBe("Mar 15, 2024 - Aug 20, 2024");
  });

  it("handles different year dates", () => {
    const result = formatDateRange("2023-11-15", "2024-02-28");
    expect(result).toBe("Nov 15, 2023 - Feb 28, 2024");
  });

  it("handles same date for start and end", () => {
    const result = formatDateRange("2024-05-10", "2024-05-10");
    expect(result).toBe("May 10, 2024 - May 10, 2024");
  });

  it("handles ISO date strings with time", () => {
    const result = formatDateRange(
      "2024-01-01T00:00:00Z",
      "2024-12-31T23:59:59Z"
    );
    // Note: Dates might be interpreted in local timezone, so we just check format
    expect(result).toMatch(/\w{3} \d{1,2}, \d{4} - \w{3} \d{1,2}, \d{4}/);
  });

  it("handles edge case dates", () => {
    const result = formatDateRange("2024-02-29", "2024-03-01"); // Leap year
    expect(result).toBe("Feb 29, 2024 - Mar 1, 2024");
  });
});

describe("formatDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats single date correctly", () => {
    const result = formatDate("2024-03-15");
    expect(result).toBe("March 15, 2024");
  });

  it("handles ISO date string with time", () => {
    const result = formatDate("2024-07-04T14:30:00Z");
    expect(result).toBe("July 4, 2024");
  });

  it("handles different months", () => {
    expect(formatDate("2024-01-01")).toBe("January 1, 2024");
    expect(formatDate("2024-02-14")).toBe("February 14, 2024");
    expect(formatDate("2024-12-25")).toBe("December 25, 2024");
  });

  it("handles leap year date", () => {
    const result = formatDate("2024-02-29");
    expect(result).toBe("February 29, 2024");
  });

  it("handles different years", () => {
    expect(formatDate("2023-06-15")).toBe("June 15, 2023");
    expect(formatDate("2025-06-15")).toBe("June 15, 2025");
  });
});

describe("formatPercentage", () => {
  it("formats percentage with default 1 decimal place", () => {
    expect(formatPercentage(25.5)).toBe("25.5%");
    expect(formatPercentage(0)).toBe("0.0%");
    expect(formatPercentage(100)).toBe("100.0%");
  });

  it("formats percentage with custom decimal places", () => {
    expect(formatPercentage(25.567, 0)).toBe("26%");
    expect(formatPercentage(25.567, 2)).toBe("25.57%");
    expect(formatPercentage(25.567, 3)).toBe("25.567%");
  });

  it("handles negative percentages", () => {
    expect(formatPercentage(-15.5)).toBe("-15.5%");
    expect(formatPercentage(-0.1, 2)).toBe("-0.10%");
  });

  it("handles very small numbers", () => {
    expect(formatPercentage(0.001, 3)).toBe("0.001%");
    expect(formatPercentage(0.0001, 4)).toBe("0.0001%");
  });

  it("handles very large numbers", () => {
    expect(formatPercentage(1000.5)).toBe("1000.5%");
    expect(formatPercentage(999999.123, 2)).toBe("999999.12%");
  });

  it("rounds correctly", () => {
    expect(formatPercentage(25.56, 1)).toBe("25.6%");
    expect(formatPercentage(25.54, 1)).toBe("25.5%");
    expect(formatPercentage(25.55, 1)).toBe("25.6%"); // Banker's rounding
  });
});

describe("formatCurrency", () => {
  it("formats positive currency values", () => {
    expect(formatCurrency(1000)).toBe("$1,000");
    expect(formatCurrency(1234567)).toBe("$1,234,567");
    expect(formatCurrency(0)).toBe("$0");
  });

  it("formats negative currency values", () => {
    expect(formatCurrency(-1000)).toBe("$-1,000");
    expect(formatCurrency(-1234567)).toBe("$-1,234,567");
  });

  it("handles decimal values", () => {
    expect(formatCurrency(1000.5)).toBe("$1,000.5");
    expect(formatCurrency(1000.0)).toBe("$1,000");
    expect(formatCurrency(1000.123)).toBe("$1,000.123");
  });

  it("handles very large numbers", () => {
    expect(formatCurrency(1000000000)).toBe("$1,000,000,000");
    expect(formatCurrency(999999999.99)).toBe("$999,999,999.99");
  });

  it("handles very small numbers", () => {
    expect(formatCurrency(0.01)).toBe("$0.01");
    expect(formatCurrency(0.001)).toBe("$0.001");
  });
});

describe("formatNumberWithAbbreviation", () => {
  it("formats billions correctly", () => {
    expect(formatNumberWithAbbreviation(1000000000)).toBe("$1.0B");
    expect(formatNumberWithAbbreviation(2500000000)).toBe("$2.5B");
    expect(formatNumberWithAbbreviation(1100000000)).toBe("$1.1B");
  });

  it("formats millions correctly", () => {
    expect(formatNumberWithAbbreviation(1000000)).toBe("$1.0M");
    expect(formatNumberWithAbbreviation(2500000)).toBe("$2.5M");
    expect(formatNumberWithAbbreviation(999999999)).toBe("$1000.0M");
  });

  it("formats thousands correctly", () => {
    expect(formatNumberWithAbbreviation(1000)).toBe("$1.0K");
    expect(formatNumberWithAbbreviation(2500)).toBe("$2.5K");
    expect(formatNumberWithAbbreviation(999999)).toBe("$1000.0K");
  });

  it("formats small numbers without abbreviation", () => {
    expect(formatNumberWithAbbreviation(999)).toBe("$999");
    expect(formatNumberWithAbbreviation(100)).toBe("$100");
    expect(formatNumberWithAbbreviation(0)).toBe("$0");
  });

  it("handles negative numbers", () => {
    expect(formatNumberWithAbbreviation(-1000000000)).toBe("$-1.0B");
    expect(formatNumberWithAbbreviation(-1000000)).toBe("$-1.0M");
    expect(formatNumberWithAbbreviation(-1000)).toBe("$-1.0K");
    expect(formatNumberWithAbbreviation(-500)).toBe("$-500");
  });

  it("handles decimal precision correctly", () => {
    expect(formatNumberWithAbbreviation(1100000000)).toBe("$1.1B");
    expect(formatNumberWithAbbreviation(1050000000)).toBe("$1.1B"); // Rounds up
    expect(formatNumberWithAbbreviation(1040000000)).toBe("$1.0B"); // Rounds down
  });

  it("handles edge cases at boundaries", () => {
    expect(formatNumberWithAbbreviation(999999999)).toBe("$1000.0M");
    expect(formatNumberWithAbbreviation(1000000000)).toBe("$1.0B");
    expect(formatNumberWithAbbreviation(999999)).toBe("$1000.0K");
    expect(formatNumberWithAbbreviation(1000000)).toBe("$1.0M");
    expect(formatNumberWithAbbreviation(999)).toBe("$999");
    expect(formatNumberWithAbbreviation(1000)).toBe("$1.0K");
  });
});

describe("getRelativeTimeDescription", () => {
  it("formats years correctly", () => {
    expect(getRelativeTimeDescription(365)).toBe("1 year");
    expect(getRelativeTimeDescription(730)).toBe("2 years");
    expect(getRelativeTimeDescription(1095)).toBe("3 years");
  });

  it("handles partial years as years when >= 365 days", () => {
    expect(getRelativeTimeDescription(400)).toBe("1 year");
    expect(getRelativeTimeDescription(800)).toBe("2 years");
  });

  it("formats months correctly", () => {
    expect(getRelativeTimeDescription(30)).toBe("1 month");
    expect(getRelativeTimeDescription(60)).toBe("2 months");
    expect(getRelativeTimeDescription(90)).toBe("3 months");
  });

  it("handles partial months as months when >= 30 days", () => {
    expect(getRelativeTimeDescription(45)).toBe("1 month");
    expect(getRelativeTimeDescription(75)).toBe("2 months");
    expect(getRelativeTimeDescription(100)).toBe("3 months");
  });

  it("handles months near year boundary", () => {
    expect(getRelativeTimeDescription(360)).toBe("12 months");
    expect(getRelativeTimeDescription(364)).toBe("12 months");
  });

  it("formats days correctly", () => {
    expect(getRelativeTimeDescription(1)).toBe("1 day");
    expect(getRelativeTimeDescription(7)).toBe("7 days");
    expect(getRelativeTimeDescription(29)).toBe("29 days");
  });

  it("handles edge cases", () => {
    expect(getRelativeTimeDescription(0)).toBe("0 days");
    expect(getRelativeTimeDescription(29)).toBe("29 days"); // Just under 1 month
    expect(getRelativeTimeDescription(31)).toBe("1 month"); // Just over 1 month
    expect(getRelativeTimeDescription(364)).toBe("12 months"); // Just under 1 year
    expect(getRelativeTimeDescription(366)).toBe("1 year"); // Just over 1 year
  });

  it("handles very large numbers", () => {
    expect(getRelativeTimeDescription(3650)).toBe("10 years");
    expect(getRelativeTimeDescription(36500)).toBe("100 years");
  });

  it("uses proper singular/plural forms", () => {
    expect(getRelativeTimeDescription(1)).toBe("1 day");
    expect(getRelativeTimeDescription(2)).toBe("2 days");
    expect(getRelativeTimeDescription(30)).toBe("1 month");
    expect(getRelativeTimeDescription(60)).toBe("2 months");
    expect(getRelativeTimeDescription(365)).toBe("1 year");
    expect(getRelativeTimeDescription(730)).toBe("2 years");
  });
});

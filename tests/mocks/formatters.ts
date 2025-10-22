import { vi } from "vitest";

/**
 * Centralized mock implementations for formatter functions.
 * Replaces duplicate mocks across 40+ test files.
 *
 * @module tests/mocks/formatters
 *
 * @example
 * ```typescript
 * import { mockFormatters } from 'tests/mocks/formatters';
 *
 * vi.mock('@/lib/formatters', () => mockFormatters);
 *
 * describe('MyComponent', () => {
 *   it('formats currency', () => {
 *     mockFormatters.formatCurrency(1234.56);
 *     expect(mockFormatters.formatCurrency).toHaveBeenCalledWith(1234.56);
 *   });
 * });
 * ```
 */
export const mockFormatters = {
  /**
   * Mock implementation of formatCurrency.
   * Supports both legacy boolean parameter and options object.
   */
  formatCurrency: vi.fn((amount: number, options: any = {}) => {
    const isHidden =
      typeof options === "boolean" ? options : options.isHidden || false;
    if (isHidden) return "****";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }),

  /**
   * Mock implementation of formatNumber.
   * Supports both legacy boolean parameter and options object.
   */
  formatNumber: vi.fn((amount: number, options: any = {}) => {
    const isHidden =
      typeof options === "boolean" ? options : options.isHidden || false;
    if (isHidden) return "***";
    return amount.toLocaleString("en-US", {
      maximumFractionDigits: options.maximumFractionDigits || 4,
      minimumFractionDigits: options.minimumFractionDigits || 0,
    });
  }),

  /**
   * Mock implementation of formatPercentage.
   */
  formatPercentage: vi.fn(
    (value: number, showPlusSign = true, decimals = 1) => {
      const sign = value >= 0 && showPlusSign ? "+" : "";
      return `${sign}${value.toFixed(decimals)}%`;
    }
  ),

  /**
   * Mock implementation of formatSmallCurrency.
   * Handles very small amounts with threshold display.
   */
  formatSmallCurrency: vi.fn((value: number, options: any = {}) => {
    const threshold = options.threshold ?? 0.01;
    if (value === 0) return "$0.00";

    const absValue = Math.abs(value);
    const isNegative = value < 0;

    if (absValue < threshold) {
      const decimals = threshold < 0.01 ? 4 : 2;
      const formatted = `< $${threshold.toFixed(decimals)}`;
      return isNegative ? `-${formatted}` : formatted;
    }

    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absValue);

    return isNegative ? `-${formatted}` : formatted;
  }),

  /**
   * Mock implementation of formatSmallNumber.
   */
  formatSmallNumber: vi.fn((num: number) => {
    if (num === 0) return "0";
    if (num < 0.000001) return "< 0.000001";
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    if (num < 100) return num.toFixed(2);
    return num.toFixed(0);
  }),

  /**
   * Mock implementation of formatEthAmount.
   */
  formatEthAmount: vi.fn((value: number, options: any = {}) => {
    const showSuffix = options.showSuffix ?? true;
    const suffix = showSuffix ? " ETH" : "";

    if (value === 0) return `0${suffix}`;
    if (value < 0.0001) return `< 0.0001${suffix}`;
    if (value < 0.01) return `${value.toFixed(8)}${suffix}`;
    if (value < 1) return `${value.toFixed(4)}${suffix}`;
    return `${value.toFixed(4)}${suffix}`;
  }),

  /**
   * Mock implementation of formatTokenAmount.
   */
  formatTokenAmount: vi.fn((amount: number, symbol: string, decimals = 4) => {
    if (amount === 0) return `0 ${symbol}`;
    if (amount < 0.0001) return `< 0.0001 ${symbol}`;
    return `${amount.toFixed(decimals)} ${symbol}`;
  }),

  /**
   * Mock implementation of formatAddress.
   * Shortens wallet addresses to standard format.
   */
  formatAddress: vi.fn((address?: string | null, options: any = {}) => {
    if (!address || typeof address !== "string") return "";

    const normalized = address.trim();
    if (normalized.length === 0) return "";

    const prefixLength = options.prefixLength || 6;
    const suffixLength = options.suffixLength || 4;
    const ellipsis = options.ellipsis || "...";

    if (normalized.length <= prefixLength + suffixLength) {
      return normalized;
    }

    return `${normalized.slice(0, prefixLength)}${ellipsis}${normalized.slice(-suffixLength)}`;
  }),

  /**
   * Mock implementation of formatChartDate.
   */
  formatChartDate: vi.fn((date: string | Date) => {
    const parsed = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(parsed.getTime())) {
      return typeof date === "string" ? date : "";
    }
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }),

  /**
   * Mock implementation of formatLargeNumber.
   */
  formatLargeNumber: vi.fn((value: number, decimals = 1) => {
    if (value === 0) return "0";

    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (absValue >= 1e9) {
      return `${sign}${(absValue / 1e9).toFixed(decimals)}B`;
    }
    if (absValue >= 1e6) {
      return `${sign}${(absValue / 1e6).toFixed(decimals)}M`;
    }
    if (absValue >= 1e3) {
      return `${sign}${(absValue / 1e3).toFixed(decimals)}K`;
    }

    return value.toString();
  }),

  /**
   * Mock implementation of formatDuration.
   */
  formatDuration: vi.fn((seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }),

  /**
   * Mock implementation of safeFormat.
   */
  safeFormat: vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    (value: any, formatter: Function, fallback = "—") => {
      if (value === null || value === undefined) return fallback;
      try {
        return formatter(value);
      } catch {
        return fallback;
      }
    }
  ),

  /**
   * Mock implementation of the formatters object.
   */
  formatters: {
    currency: vi.fn((value: number) =>
      mockFormatters.formatCurrency(Math.round(value))
    ),
    currencyPrecise: vi.fn((value: number) =>
      mockFormatters.formatCurrency(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    ),
    percent: vi.fn(
      (value: number, decimals = 1) => `${value.toFixed(decimals)}%`
    ),
    chartDate: vi.fn((date: string | Date) =>
      mockFormatters.formatChartDate(date)
    ),
    number: vi.fn((amount: number) => mockFormatters.formatNumber(amount)),
  },

  // Legacy exports for backward compatibility
  formatCurrencyValue: vi.fn((amount: number, options: any = {}) =>
    mockFormatters.formatCurrency(amount, options)
  ),
  formatNumericValue: vi.fn((amount: number, options: any = {}) =>
    mockFormatters.formatNumber(amount, options)
  ),
  formatPercentageValue: vi.fn(
    (value: number, showPlusSign = true, decimals = 1) =>
      mockFormatters.formatPercentage(value, showPlusSign, decimals)
  ),
  formatSmallCurrencyValue: vi.fn((value: number, options: any = {}) =>
    mockFormatters.formatSmallCurrency(value, options)
  ),
  formatSmallNumericValue: vi.fn((num: number) =>
    mockFormatters.formatSmallNumber(num)
  ),
};

/**
 * Helper function to reset all formatter mocks.
 * Use in beforeEach or afterEach hooks.
 *
 * @example
 * ```typescript
 * import { mockFormatters, resetFormatterMocks } from 'tests/mocks/formatters';
 *
 * describe('MyComponent', () => {
 *   beforeEach(() => {
 *     resetFormatterMocks();
 *   });
 * });
 * ```
 */
export function resetFormatterMocks() {
  Object.values(mockFormatters).forEach(mock => {
    if (typeof mock === "function" && "mockClear" in mock) {
      mock.mockClear();
    } else if (typeof mock === "object") {
      Object.values(mock).forEach(nestedMock => {
        if (typeof nestedMock === "function" && "mockClear" in nestedMock) {
          nestedMock.mockClear();
        }
      });
    }
  });
}

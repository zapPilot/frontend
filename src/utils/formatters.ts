/**
 * Comprehensive Formatting Utilities
 *
 * Consolidates all formatting functions from formatters.js and lib/utils.ts
 * into a single, type-safe TypeScript module with comprehensive functionality.
 *
 * @module utils/formatters
 */

import { PORTFOLIO_CONFIG } from "../constants/portfolio";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface CurrencyFormatOptions {
  /** Show hidden placeholder when true */
  isHidden?: boolean;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Currency code (defaults to USD) */
  currency?: string;
  /** Locale for formatting (defaults to en-US) */
  locale?: string;
  /** Smart precision mode: shows "< $threshold" for very small values */
  smartPrecision?: boolean;
  /** Threshold for smart precision mode (default: 0.01) */
  threshold?: number;
  /** Show negative values in smart precision mode */
  showNegative?: boolean;
}

interface NumberFormatOptions {
  /** Show hidden placeholder when true */
  isHidden?: boolean;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Locale for formatting */
  locale?: string;
  /** Smart precision mode: adjusts decimal places based on value magnitude */
  smartPrecision?: boolean;
}

interface AddressFormatOptions {
  /** Number of characters to keep from the start of the address */
  prefixLength?: number;
  /** Number of characters to keep from the end of the address */
  suffixLength?: number;
  /** Separator to use between the trimmed segments */
  ellipsis?: string;
}

// =============================================================================
// CURRENCY FORMATTING
// =============================================================================

/**
 * Format currency values with comprehensive options
 * Supports hidden placeholders, international formatting, and smart precision
 *
 * @param amount - The numerical amount to format
 * @param optionsOrIsHidden - Formatting options object or boolean for isHidden (legacy)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(0.005, { smartPrecision: true }) // "< $0.01"
 * formatCurrency(1234, { minimumFractionDigits: 0 }) // "$1,234"
 */
export function formatCurrency(
  amount: number,
  optionsOrIsHidden: CurrencyFormatOptions | boolean = {}
): string {
  // Handle legacy boolean parameter
  const options: CurrencyFormatOptions =
    typeof optionsOrIsHidden === "boolean"
      ? { isHidden: optionsOrIsHidden }
      : optionsOrIsHidden;

  const {
    isHidden = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    currency = PORTFOLIO_CONFIG.CURRENCY_CODE,
    locale = PORTFOLIO_CONFIG.CURRENCY_LOCALE,
    smartPrecision = false,
    threshold = 0.01,
    showNegative = true,
  } = options;

  if (isHidden) return PORTFOLIO_CONFIG.HIDDEN_BALANCE_PLACEHOLDER;

  // Smart precision mode: handle very small amounts
  if (smartPrecision) {
    if (amount === 0) return "$0.00";

    const absValue = Math.abs(amount);
    const isNegative = amount < 0 && showNegative;

    if (absValue < threshold) {
      const thresholdDecimals = threshold < 0.01 ? 4 : 2;
      const formatted = `< $${threshold.toFixed(thresholdDecimals)}`;
      return isNegative ? `-${formatted}` : formatted;
    }

    // For values above threshold, use standard formatting
    const formatted = `$${absValue.toFixed(minimumFractionDigits)}`;
    return isNegative ? `-${formatted}` : formatted;
  }

  // Standard Intl.NumberFormat formatting
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

/**
 * Format numbers with optional hiding, localization, and smart precision
 *
 * @param amount - The numerical amount to format
 * @param optionsOrIsHidden - Formatting options object or boolean for isHidden (legacy)
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234.56) // "1,234.56"
 * formatNumber(0.000005, { smartPrecision: true }) // "< 0.000001"
 * formatNumber(0.005, { smartPrecision: true }) // "0.005000"
 */
export function formatNumber(
  amount: number,
  optionsOrIsHidden: NumberFormatOptions | boolean = {}
): string {
  // Handle legacy boolean parameter
  const options: NumberFormatOptions =
    typeof optionsOrIsHidden === "boolean"
      ? { isHidden: optionsOrIsHidden }
      : optionsOrIsHidden;

  const {
    isHidden = false,
    maximumFractionDigits = 4,
    minimumFractionDigits = 0,
    locale = PORTFOLIO_CONFIG.CURRENCY_LOCALE,
    smartPrecision = false,
  } = options;

  if (isHidden) return PORTFOLIO_CONFIG.HIDDEN_NUMBER_PLACEHOLDER;

  // Smart precision mode: adjust decimal places based on value magnitude
  if (smartPrecision) {
    if (amount === 0) return "0";
    if (amount < 0.000001) return "< 0.000001";
    if (amount < 0.01) return amount.toFixed(6);
    if (amount < 1) return amount.toFixed(4);
    if (amount < 100) return amount.toFixed(2);
    return amount.toFixed(0);
  }

  // Standard toLocaleString formatting
  return amount.toLocaleString(locale, {
    maximumFractionDigits,
    minimumFractionDigits,
  });
}

// =============================================================================
// PERCENTAGE FORMATTING
// =============================================================================

/**
 * Format percentage values with appropriate sign
 *
 * @param value - The percentage value
 * @param showPlusSign - Show + sign for positive values
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  showPlusSign = true,
  decimals = 1
): string {
  const sign = value >= 0 && showPlusSign ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}


// Unused export removed: formatTokenAmount

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format large numbers with K/M/B suffixes
 *
 * @param value - The numerical value
 * @param decimals - Number of decimal places
 * @returns Formatted string with suffix
 */
export function formatLargeNumber(value: number, decimals = 1): string {
  if (value === 0) return "0";

  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}b`;
  }
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}m`;
  }
  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}k`;
  }

  return value.toString();
}

// =============================================================================
// ADDRESS & IDENTIFIER FORMATTING
// =============================================================================

/**
 * Shorten wallet addresses or transaction hashes while preserving readability.
 * Defaults to the common 0x123456...CDEF style but can be customised.
 */
export function formatAddress(
  address?: string | null,
  options: AddressFormatOptions = {}
): string {
  if (!address || typeof address !== "string") {
    return "";
  }

  const normalized = address.trim();
  if (normalized.length === 0) {
    return "";
  }

  const { prefixLength = 6, suffixLength = 4, ellipsis = "..." } = options;

  if (normalized.length <= prefixLength + suffixLength) {
    return normalized;
  }

  return `${normalized.slice(0, prefixLength)}${ellipsis}${normalized.slice(
    -suffixLength
  )}`;
}

// =============================================================================
// DATE FORMATTING
// =============================================================================

/**
 * Format date for chart labels
 * Standard format: "Mon DD, YYYY"
 *
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatChartDate(date: string | Date): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) {
    return typeof date === "string" ? date : "";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// =============================================================================
// FORMATTERS OBJECT - UNIFIED API
// =============================================================================

/**
 * Unified formatters object for easy imports
 * Provides convenient access to all formatting functions
 *
 * @example
 * import { formatters } from '@/utils/formatters';
 * const formatted = formatters.currency(1000); // "$1,000.00"
 * const percent = formatters.percent(25.5); // "25.5%"
 */
export const formatters = {
  /** Format currency values - rounded to dollars */
  currency: (value: number) =>
    formatCurrency(Math.round(value), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),

  /** Format currency with precise decimals (alias to formatCurrency) */
  currencyPrecise: formatCurrency,

  /** Format percentage values */
  percent: (value: number, decimals = 1) => `${value.toFixed(decimals)}%`,

  /** Format chart date labels */
  chartDate: formatChartDate,

  /** Format numbers with locale */
  number: formatNumber,
} as const;

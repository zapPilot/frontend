/* c8 ignore start */
/**
 * Comprehensive Formatting Utilities
 *
 * Consolidates all formatting functions from formatters.js and lib/utils.ts
 * into a single, type-safe TypeScript module with comprehensive functionality.
 *
 * @module lib/formatters
 */

import { PORTFOLIO_CONFIG } from "../constants/portfolio";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface CurrencyFormatOptions {
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
}

export interface SmallCurrencyOptions {
  /** Values below this show as "< $threshold" */
  threshold?: number;
  /** Decimal places for threshold display */
  thresholdDecimals?: number;
  /** Decimal places for normal amounts */
  normalDecimals?: number;
  /** Show negative values */
  showNegative?: boolean;
}

export interface NumberFormatOptions {
  /** Show hidden placeholder when true */
  isHidden?: boolean;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Locale for formatting */
  locale?: string;
}

export interface EthFormatOptions {
  /** Show ETH suffix */
  showSuffix?: boolean;
  /** Precision for different value ranges */
  precision?: {
    tiny: number; // < 0.0001
    small: number; // < 0.01
    medium: number; // < 1
    large: number; // >= 1
  };
}

export interface AddressFormatOptions {
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
 * Supports hidden placeholders and international formatting
 *
 * @param amount - The numerical amount to format
 * @param optionsOrIsHidden - Formatting options object or boolean for isHidden (legacy)
 * @returns Formatted currency string
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
  } = options;

  if (isHidden) return PORTFOLIO_CONFIG.HIDDEN_BALANCE_PLACEHOLDER;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Format currency with smart handling for very small amounts
 * Shows "< $threshold" for values below threshold
 *
 * @param value - The numerical value to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatSmallCurrency(
  value: number,
  options: SmallCurrencyOptions = {}
): string {
  const {
    threshold = 0.01,
    thresholdDecimals = 4,
    normalDecimals = 2,
    showNegative = true,
  } = options;

  if (value === 0) return "$0.00";

  const absValue = Math.abs(value);
  const isNegative = value < 0 && showNegative;

  if (absValue < threshold) {
    const formatted = `< $${threshold.toFixed(thresholdDecimals)}`;
    return isNegative ? `-${formatted}` : formatted;
  }

  const formatted = `$${absValue.toFixed(normalDecimals)}`;
  return isNegative ? `-${formatted}` : formatted;
}

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

/**
 * Format numbers with optional hiding and localization
 *
 * @param amount - The numerical amount to format
 * @param optionsOrIsHidden - Formatting options object or boolean for isHidden (legacy)
 * @returns Formatted number string
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
  } = options;

  if (isHidden) return PORTFOLIO_CONFIG.HIDDEN_NUMBER_PLACEHOLDER;

  return amount.toLocaleString(locale, {
    maximumFractionDigits,
    minimumFractionDigits,
  });
}

/**
 * Format small numbers with appropriate precision
 * Handles very small values with appropriate decimal places
 *
 * @param num - The number to format
 * @returns Formatted number string
 */
export function formatSmallNumber(num: number): string {
  if (num === 0) return "0";
  if (num < 0.000001) return "< 0.000001";
  if (num < 0.01) return num.toFixed(6);
  if (num < 1) return num.toFixed(4);
  if (num < 100) return num.toFixed(2);
  return num.toFixed(0);
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

// =============================================================================
// CRYPTOCURRENCY FORMATTING
// =============================================================================

/**
 * Format ETH amounts with variable precision based on value
 *
 * @param value - The ETH value to format
 * @param options - Formatting options
 * @returns Formatted ETH amount string
 */
export function formatEthAmount(
  value: number,
  options: EthFormatOptions = {}
): string {
  const {
    showSuffix = true,
    precision = {
      tiny: 8, // < 0.0001
      small: 8, // < 0.01
      medium: 4, // < 1
      large: 4, // >= 1
    },
  } = options;

  const suffix = showSuffix ? " ETH" : "";

  if (value === 0) return `0${suffix}`;
  if (value < 0.0001) return `< 0.0001${suffix}`;
  if (value < 0.01) return `${value.toFixed(precision.tiny)}${suffix}`;
  if (value < 1) return `${value.toFixed(precision.medium)}${suffix}`;
  return `${value.toFixed(precision.large)}${suffix}`;
}

/**
 * Format token amounts with symbol
 *
 * @param amount - Token amount
 * @param symbol - Token symbol
 * @param decimals - Number of decimal places
 * @returns Formatted token amount with symbol
 */
export function formatTokenAmount(
  amount: number,
  symbol: string,
  decimals = 4
): string {
  if (amount === 0) return `0 ${symbol}`;
  if (amount < 0.0001) return `< 0.0001 ${symbol}`;
  return `${amount.toFixed(decimals)} ${symbol}`;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Safe number formatting that handles null/undefined values
 *
 * @param value - Value to format (may be null/undefined)
 * @param formatter - Formatting function to apply
 * @param fallback - Fallback string for null/undefined values
 * @returns Formatted string or fallback
 */
export function safeFormat<T>(
  value: T | null | undefined,
  formatter: (val: T) => string,
  fallback = "—"
): string {
  if (value === null || value === undefined) return fallback;
  try {
    return formatter(value);
  } catch {
    return fallback;
  }
}

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
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`;
  }
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`;
  }
  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`;
  }

  return value.toString();
}

/**
 * Format time duration in human readable format
 *
 * @param seconds - Duration in seconds
 * @returns Human readable duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
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
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) {
    return typeof date === 'string' ? date : '';
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
 * import { formatters } from '@/lib/formatters';
 * const formatted = formatters.currency(1000); // "$1,000.00"
 * const percent = formatters.percent(25.5); // "25.5%"
 */
export const formatters = {
  /** Format currency values - rounded to dollars */
  currency: (value: number) => formatCurrency(Math.round(value)),

  /** Format currency with precise decimals */
  currencyPrecise: (value: number) => formatCurrency(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),

  /** Format percentage values */
  percent: (value: number, decimals = 1) => `${value.toFixed(decimals)}%`,

  /** Format chart date labels */
  chartDate: formatChartDate,

  /** Format numbers with locale */
  number: formatNumber,
} as const;

// =============================================================================
// EXPORTS FOR BACKWARD COMPATIBILITY
// =============================================================================

// Re-export main functions for easier migration
export {
  formatCurrency as formatCurrencyValue,
  formatNumber as formatNumericValue,
  formatPercentage as formatPercentageValue,
  formatSmallCurrency as formatSmallCurrencyValue,
  formatSmallNumber as formatSmallNumericValue,
};
/* c8 ignore stop */

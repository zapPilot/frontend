/**
 * Comprehensive Formatting Utilities
 *
 * Consolidates all formatting functions from formatters.js and lib/utils.ts
 * into a single, type-safe TypeScript module with comprehensive functionality.
 *
 * @module utils/formatters
 */

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

import { PORTFOLIO_CONFIG } from "../constants/portfolio";
import { logger } from "./logger";

// Initialize dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(utc);

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
// DATA FRESHNESS FORMATTING
// =============================================================================

/**
 * Data freshness state classification
 */
export type FreshnessState = "fresh" | "stale" | "very-stale" | "unknown";

/**
 * Data freshness information
 */
export interface DataFreshness {
  /** Relative time string (e.g., "2 hours ago") */
  relativeTime: string;
  /** Freshness state for UI styling */
  state: FreshnessState;
  /** Hours since last update */
  hoursSince: number;
  /** ISO timestamp of last update */
  timestamp: string;
  /** Whether data is current (< 24h) */
  isCurrent: boolean;
}

/**
 * Calculate data freshness from last_updated timestamp
 *
 * @param lastUpdated - ISO date string from API (YYYY-MM-DD format)
 * @returns Data freshness information
 *
 * @example
 * calculateDataFreshness('2025-12-28') // { relativeTime: '1 day ago', state: 'stale', ... }
 */
export function calculateDataFreshness(
  lastUpdated: string | null | undefined
): DataFreshness {
  if (!lastUpdated) {
    return {
      relativeTime: "Unknown",
      state: "unknown",
      hoursSince: Infinity,
      timestamp: "",
      isCurrent: false,
    };
  }

  try {
    // Parse as UTC date
    const updateTime = dayjs.utc(lastUpdated);
    const now = dayjs.utc();

    // Validate date
    if (!updateTime.isValid()) {
      return {
        relativeTime: "Unknown",
        state: "unknown",
        hoursSince: Infinity,
        timestamp: lastUpdated,
        isCurrent: false,
      };
    }

    const hoursSince = now.diff(updateTime, "hour", true);
    const relativeTime = updateTime.fromNow(); // "2 hours ago"

    // Determine freshness state (inclusive boundaries)
    let state: FreshnessState;
    if (hoursSince <= 24) {
      state = "fresh"; // Purple-blue gradient (≤24h)
    } else if (hoursSince <= 72) {
      state = "stale"; // Amber warning (24-72h)
    } else {
      state = "very-stale"; // Red alert (>72h)
    }

    return {
      relativeTime,
      state,
      hoursSince,
      timestamp: lastUpdated,
      isCurrent: hoursSince <= 24,
    };
  } catch (error) {
    logger.error("Error calculating data freshness", error, "formatters");
    return {
      relativeTime: "Unknown",
      state: "unknown",
      hoursSince: Infinity,
      timestamp: lastUpdated,
      isCurrent: false,
    };
  }
}

/**
 * Format relative time with custom precision
 *
 * @example
 * formatRelativeTime('2025-12-29T10:00:00Z') // "2 hours ago"
 */
export function formatRelativeTime(
  dateString: string | null | undefined
): string {
  if (!dateString) return "Unknown";

  try {
    const date = dayjs.utc(dateString);
    if (!date.isValid()) {
      return "Unknown";
    }
    return date.fromNow();
  } catch {
    return "Unknown";
  }
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

  /** Calculate data freshness */
  dataFreshness: calculateDataFreshness,

  /** Format relative time */
  relativeTime: formatRelativeTime,
} as const;

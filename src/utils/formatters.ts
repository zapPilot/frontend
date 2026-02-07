/**
 * Comprehensive Formatting Utilities
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

interface BaseFormatOptions {
  /** Show hidden placeholder when true */
  isHidden?: boolean;
  /** Locale for formatting */
  locale?: string;
  /** Smart precision mode: adjusts presentation based on magnitude */
  smartPrecision?: boolean;
}

export interface CurrencyFormatOptions extends BaseFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  currency?: string;
  /** Threshold for smart precision mode (default: 0.01) */
  threshold?: number;
  /** Show negative values in smart precision mode */
  showNegative?: boolean;
}

export interface NumberFormatOptions extends BaseFormatOptions {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

export interface AddressFormatOptions {
  prefixLength?: number;
  suffixLength?: number;
  ellipsis?: string;
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

function normalizeOptions<T extends BaseFormatOptions>(
  optionsOrHidden: T | boolean,
  defaultOptions: T
): T {
  if (typeof optionsOrHidden === "boolean") {
    return { ...defaultOptions, isHidden: optionsOrHidden };
  }
  return { ...defaultOptions, ...optionsOrHidden };
}

function formatSmartCurrency(
  amount: number,
  threshold: number,
  showNegative: boolean,
  minDecimals: number
): string {
  if (amount === 0) return "$0.00";

  const absValue = Math.abs(amount);
  const isNegative = amount < 0 && showNegative;
  const prefix = isNegative ? "-" : "";

  if (absValue < threshold) {
    const thresholdDecimals = threshold < 0.01 ? 4 : 2;
    return `${prefix}< $${threshold.toFixed(thresholdDecimals)}`;
  }

  return `${prefix}$${absValue.toFixed(minDecimals)}`;
}

// =============================================================================
// CURRENCY FORMATTING
// =============================================================================

export function formatCurrency(
  amount: number,
  optionsOrIsHidden: CurrencyFormatOptions | boolean = {}
): string {
  const options = normalizeOptions(optionsOrIsHidden, {
    currency: PORTFOLIO_CONFIG.CURRENCY_CODE,
    locale: PORTFOLIO_CONFIG.CURRENCY_LOCALE,
    threshold: 0.01,
    showNegative: true,
  });

  if (options.isHidden) return PORTFOLIO_CONFIG.HIDDEN_BALANCE_PLACEHOLDER;

  const maxDigits = options.maximumFractionDigits ?? 2;
  const minDigits = Math.min(options.minimumFractionDigits ?? 2, maxDigits);

  if (options.smartPrecision) {
    return formatSmartCurrency(
      amount,
      options.threshold ?? 0.01,
      options.showNegative ?? true,
      minDigits
    );
  }

  return new Intl.NumberFormat(options.locale, {
    style: "currency",
    currency: options.currency,
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(amount);
}

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

export function formatNumber(
  amount: number,
  optionsOrIsHidden: NumberFormatOptions | boolean = {}
): string {
  const options = normalizeOptions(optionsOrIsHidden, {
    locale: PORTFOLIO_CONFIG.CURRENCY_LOCALE,
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  });

  if (options.isHidden) return PORTFOLIO_CONFIG.HIDDEN_NUMBER_PLACEHOLDER;

  if (options.smartPrecision) {
    if (amount === 0) return "0";
    if (amount < 0.000001) return "< 0.000001";
    if (amount < 0.01) return amount.toFixed(6);
    if (amount < 1) return amount.toFixed(4);
    if (amount < 100) return amount.toFixed(2);
    return amount.toFixed(0);
  }

  return amount.toLocaleString(options.locale, {
    maximumFractionDigits: options.maximumFractionDigits,
    minimumFractionDigits: options.minimumFractionDigits,
  });
}

// =============================================================================
// ADDRESS & DATE FORMATTING
// =============================================================================

export function formatAddress(
  address?: string | null,
  {
    prefixLength = 6,
    suffixLength = 4,
    ellipsis = "...",
  }: AddressFormatOptions = {}
): string {
  if (!address || typeof address !== "string") return "";
  const normalized = address.trim();
  if (!normalized) return "";

  if (normalized.length <= prefixLength + suffixLength) return normalized;
  return `${normalized.slice(0, prefixLength)}${ellipsis}${normalized.slice(-suffixLength)}`;
}

export function formatChartDate(date: string | Date): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime()))
    return typeof date === "string" ? date : "";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// =============================================================================
// DATA FRESHNESS
// =============================================================================

export type FreshnessState = "fresh" | "stale" | "very-stale" | "unknown";

export interface DataFreshness {
  relativeTime: string;
  state: FreshnessState;
  hoursSince: number;
  timestamp: string;
  isCurrent: boolean;
}

const UNKNOWN_FRESHNESS: DataFreshness = {
  relativeTime: "Unknown",
  state: "unknown",
  hoursSince: Infinity,
  timestamp: "",
  isCurrent: false,
};

function getFreshnessState(hours: number): FreshnessState {
  if (hours <= 24) return "fresh";
  if (hours <= 72) return "stale";
  return "very-stale";
}

export function calculateDataFreshness(
  lastUpdated: string | null | undefined
): DataFreshness {
  if (!lastUpdated) return UNKNOWN_FRESHNESS;

  try {
    const updateTime = dayjs.utc(lastUpdated);
    if (!updateTime.isValid()) {
      return { ...UNKNOWN_FRESHNESS, timestamp: lastUpdated };
    }

    const hoursSince = dayjs.utc().diff(updateTime, "hour", true);

    return {
      relativeTime: updateTime.fromNow(),
      state: getFreshnessState(hoursSince),
      hoursSince,
      timestamp: lastUpdated,
      isCurrent: hoursSince <= 24,
    };
  } catch (error) {
    logger.error("Error calculating data freshness", error, "formatters");
    return { ...UNKNOWN_FRESHNESS, timestamp: lastUpdated };
  }
}

export function formatRelativeTime(
  dateString: string | null | undefined
): string {
  if (!dateString) return "Unknown";
  try {
    const date = dayjs.utc(dateString);
    return date.isValid() ? date.fromNow() : "Unknown";
  } catch {
    return "Unknown";
  }
}

// =============================================================================
// UNIFIED API
// =============================================================================

export const formatters = {
  currency: (value: number) =>
    formatCurrency(Math.round(value), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
  currencyPrecise: formatCurrency,
  percent: (value: number, decimals = 1) => `${value.toFixed(decimals)}%`,
  chartDate: formatChartDate,
  number: formatNumber,
  dataFreshness: calculateDataFreshness,
  relativeTime: formatRelativeTime,
} as const;

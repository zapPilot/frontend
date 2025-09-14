/**
 * Risk Formatting Utilities
 *
 * Utility functions for formatting risk-related data for display
 */

/**
 * Format a date range into a human-readable string for display
 *
 * @param startDate - The start date in ISO string format (e.g., "2024-01-01")
 * @param endDate - The end date in ISO string format (e.g., "2024-12-31")
 * @returns Formatted date range string (e.g., "Jan 1, 2024 - Dec 31, 2024")
 *
 * @description
 * Converts ISO date strings or Date-compatible strings into a localized format
 * using en-US locale with abbreviated month names. Handles timezone conversion
 * appropriately for display purposes.
 *
 * @example
 * ```typescript
 * formatDateRange("2024-01-01", "2024-12-31");
 * // Returns: "Jan 1, 2024 - Dec 31, 2024"
 *
 * formatDateRange("2024-03-15T10:30:00Z", "2024-08-20T15:45:00Z");
 * // Returns: "Mar 15, 2024 - Aug 20, 2024"
 * ```
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startStr} - ${endStr}`;
}

/**
 * Format a single date into a human-readable string for display
 *
 * @param date - The date in ISO string format or Date-compatible string
 * @returns Formatted date string (e.g., "March 15, 2024")
 *
 * @description
 * Converts ISO date strings into a localized format using en-US locale
 * with full month names. Commonly used for displaying significant dates
 * like maximum drawdown occurrence dates.
 *
 * @example
 * ```typescript
 * formatDate("2024-03-15");
 * // Returns: "March 15, 2024"
 *
 * formatDate("2024-07-04T14:30:00Z");
 * // Returns: "July 4, 2024"
 * ```
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a numeric value as a percentage string for display
 *
 * @param value - The numeric value to format as a percentage
 * @param decimals - The number of decimal places to display (default: 1)
 * @returns Formatted percentage string with % symbol (e.g., "25.5%")
 *
 * @description
 * Converts numeric values to percentage format with customizable precision.
 * Does not multiply by 100 - assumes input is already in percentage form.
 * Handles positive, negative, and zero values appropriately.
 *
 * @example
 * ```typescript
 * formatPercentage(25.567);      // Returns: "25.6%"
 * formatPercentage(25.567, 0);   // Returns: "26%"
 * formatPercentage(25.567, 2);   // Returns: "25.57%"
 * formatPercentage(-15.5);       // Returns: "-15.5%"
 * formatPercentage(0);           // Returns: "0.0%"
 * ```
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a numeric value as a currency string with thousands separators
 *
 * @param value - The numeric value to format as currency
 * @returns Formatted currency string with $ symbol and commas (e.g., "$1,234,567")
 *
 * @description
 * Converts numeric values to USD currency format using browser's locale formatting.
 * Automatically adds thousands separators and handles decimal precision.
 * Supports positive, negative, and fractional values.
 *
 * @example
 * ```typescript
 * formatCurrency(1000);       // Returns: "$1,000"
 * formatCurrency(1234567);    // Returns: "$1,234,567"
 * formatCurrency(-1000);      // Returns: "$-1,000"
 * formatCurrency(1000.50);    // Returns: "$1,000.5"
 * formatCurrency(0.01);       // Returns: "$0.01"
 * ```
 */
export function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

/**
 * Format large numbers with abbreviations for compact display
 *
 * @param value - The numeric value to format with abbreviations
 * @returns Formatted string with K/M/B suffixes and $ symbol (e.g., "$1.2M")
 *
 * @description
 * Converts large numbers into compact format using standard financial abbreviations:
 * - K: Thousands (1,000+)
 * - M: Millions (1,000,000+)
 * - B: Billions (1,000,000,000+)
 *
 * Handles negative numbers by preserving the sign. Numbers below 1,000
 * are displayed without abbreviation. Rounds to 1 decimal place for
 * abbreviated values.
 *
 * @example
 * ```typescript
 * formatNumberWithAbbreviation(1500);        // Returns: "$1.5K"
 * formatNumberWithAbbreviation(2500000);     // Returns: "$2.5M"
 * formatNumberWithAbbreviation(1200000000);  // Returns: "$1.2B"
 * formatNumberWithAbbreviation(-1500000);    // Returns: "$-1.5M"
 * formatNumberWithAbbreviation(500);         // Returns: "$500"
 * ```
 */
export function formatNumberWithAbbreviation(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1e9) {
    return `$${sign}${(absValue / 1e9).toFixed(1)}B`;
  } else if (absValue >= 1e6) {
    return `$${sign}${(absValue / 1e6).toFixed(1)}M`;
  } else if (absValue >= 1e3) {
    return `$${sign}${(absValue / 1e3).toFixed(1)}K`;
  } else {
    return `$${sign}${absValue.toFixed(0)}`;
  }
}

/**
 * Convert a number of days into a human-readable relative time description
 *
 * @param days - The number of days to convert
 * @returns Human-readable time description (e.g., "2 months", "1 year")
 *
 * @description
 * Converts day counts into the most appropriate time unit for display:
 * - Days: 1-29 days → "X day(s)"
 * - Months: 30-364 days → "X month(s)" (30-day months)
 * - Years: 365+ days → "X year(s)" (365-day years)
 *
 * Uses proper singular/plural forms and rounds down to whole units.
 * Useful for displaying analysis periods and data timeframes.
 *
 * @example
 * ```typescript
 * getRelativeTimeDescription(1);    // Returns: "1 day"
 * getRelativeTimeDescription(7);    // Returns: "7 days"
 * getRelativeTimeDescription(30);   // Returns: "1 month"
 * getRelativeTimeDescription(90);   // Returns: "3 months"
 * getRelativeTimeDescription(365);  // Returns: "1 year"
 * getRelativeTimeDescription(730);  // Returns: "2 years"
 * ```
 */
export function getRelativeTimeDescription(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return years === 1 ? "1 year" : `${years} years`;
  } else if (days >= 30) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month" : `${months} months`;
  } else {
    return days === 1 ? "1 day" : `${days} days`;
  }
}

/**
 * Format Sharpe ratio value for display with appropriate precision
 *
 * @param sharpeRatio - The Sharpe ratio value to format
 * @param decimals - The number of decimal places to display (default: 2)
 * @returns Formatted Sharpe ratio string (e.g., "1.45", "0.89", "-0.12")
 *
 * @description
 * Formats Sharpe ratio values with standard financial precision. Values above 1.0
 * are generally considered good, above 2.0 very good, and above 3.0 excellent.
 * Negative values indicate returns below the risk-free rate.
 *
 * @example
 * ```typescript
 * formatSharpeRatio(2.419);     // Returns: "2.42"
 * formatSharpeRatio(0.856);     // Returns: "0.86"
 * formatSharpeRatio(-0.234);    // Returns: "-0.23"
 * formatSharpeRatio(1.5, 1);    // Returns: "1.5"
 * ```
 */
export function formatSharpeRatio(
  sharpeRatio: number,
  decimals: number = 2
): string {
  return sharpeRatio.toFixed(decimals);
}

/**
 * Get Sharpe ratio interpretation and color classification
 *
 * @param sharpeRatio - The Sharpe ratio value to interpret
 * @returns Object containing interpretation text and CSS color class
 *
 * @description
 * Provides standard interpretation of Sharpe ratio values:
 * - Below 0: Poor (negative risk-adjusted returns)
 * - 0 to 1: Acceptable (positive but modest risk-adjusted returns)
 * - 1 to 2: Good (solid risk-adjusted returns)
 * - 2 to 3: Very Good (excellent risk-adjusted returns)
 * - Above 3: Exceptional (outstanding risk-adjusted returns)
 *
 * @example
 * ```typescript
 * getSharpeRatioInterpretation(2.42);
 * // Returns: { text: "Very Good", colorClass: "text-blue-400" }
 *
 * getSharpeRatioInterpretation(0.75);
 * // Returns: { text: "Acceptable", colorClass: "text-yellow-400" }
 * ```
 */
export function getSharpeRatioInterpretation(sharpeRatio: number): {
  text: string;
  colorClass: string;
} {
  if (sharpeRatio < 0) {
    return { text: "Poor", colorClass: "text-red-400" };
  } else if (sharpeRatio < 1) {
    return { text: "Acceptable", colorClass: "text-yellow-400" };
  } else if (sharpeRatio < 2) {
    return { text: "Good", colorClass: "text-green-400" };
  } else if (sharpeRatio < 3) {
    return { text: "Very Good", colorClass: "text-blue-400" };
  } else {
    return { text: "Exceptional", colorClass: "text-purple-400" };
  }
}

/**
 * Format portfolio annual return as a percentage for display
 *
 * @param returnValue - The annual return value (as decimal, e.g., 0.18 for 18%)
 * @param decimals - The number of decimal places to display (default: 1)
 * @returns Formatted return percentage string (e.g., "18.2%", "-5.3%")
 *
 * @description
 * Converts decimal return values to percentage format for display purposes.
 * Handles positive, negative, and zero returns appropriately with proper
 * sign display and percentage symbol.
 *
 * @example
 * ```typescript
 * formatAnnualReturn(0.03819);   // Returns: "3.8%"
 * formatAnnualReturn(-0.0534);   // Returns: "-5.3%"
 * formatAnnualReturn(0.182, 2);  // Returns: "18.20%"
 * ```
 */
export function formatAnnualReturn(
  returnValue: number,
  decimals: number = 1
): string {
  const percentage = returnValue * 100;
  return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(decimals)}%`;
}

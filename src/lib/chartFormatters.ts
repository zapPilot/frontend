/**
 * Chart formatting utilities for consistent data presentation across charts
 */

/**
 * Formats a date for chart display with month, day, and year
 *
 * @param date - Date string or Date object to format
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 *
 * @example
 * ```typescript
 * formatChartDate("2025-01-15") // "Jan 15, 2025"
 * formatChartDate(new Date(2025, 0, 15)) // "Jan 15, 2025"
 * ```
 */
export function formatChartDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

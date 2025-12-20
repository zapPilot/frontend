/**
 * Formatting Utilities for Analytics Charts
 *
 * Date and label formatting functions
 */

/**
 * Format date for chart labels
 *
 * @param date - ISO date string
 * @returns Formatted date (e.g., "Jan 15, 2024")
 */
export const formatDateLabel = (date: string): string =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

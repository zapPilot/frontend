/**
 * Performance thresholds for portfolio analytics.
 * Used for color-coding metrics and identifying underperformance.
 *
 * These thresholds were extracted from magic numbers in WalletMetrics
 * to provide a centralized source of truth for performance evaluation.
 *
 * @module config/performance-thresholds
 */

/**
 * APR (Annual Percentage Rate) thresholds for portfolio performance evaluation.
 * All values are in decimal format (0.05 = 5%).
 */
export const APR_THRESHOLDS = {
  /**
   * APR above 5% is considered "good" performance (green indicator)
   * @constant {number}
   */
  HIGH: 0.05,

  /**
   * APR above 1% is considered "acceptable" performance (yellow indicator)
   * @constant {number}
   */
  LOW: 0.01,

  /**
   * APR below 2.5% triggers underperformance warning
   * This is used in pool analytics to identify underperforming positions
   * @constant {number}
   */
  CRITICAL: 0.025,
} as const;

/**
 * Yield data confidence thresholds.
 * Determines when yield data is considered reliable enough for display.
 */
export const YIELD_DATA_THRESHOLDS = {
  /**
   * Minimum days of data required for preliminary yield calculation
   * Below this, show "Available in X days" message
   * @constant {number}
   */
  MIN_DAYS_FOR_PRELIMINARY: 7,

  /**
   * Days of data required for high-confidence yield calculation
   * Below this but above MIN_DAYS, show "Improving" badge
   * @constant {number}
   */
  MIN_DAYS_FOR_CONFIDENCE: 30,
} as const;

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
 * Drawdown thresholds for portfolio risk assessment.
 * All values are in decimal format (negative values indicate loss).
 */
export const DRAWDOWN_THRESHOLDS = {
  /**
   * Drawdown recovery threshold
   * Above this value, portfolio is considered recovering (-0.05% = minor drawdown)
   * @constant {number}
   */
  RECOVERY: -0.0005,

  /**
   * Severe drawdown threshold
   * Below this value, portfolio is in critical drawdown state (-15% loss)
   * @constant {number}
   */
  SEVERE: -0.15,
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

/**
 * Helper functions for threshold evaluation
 */
export const ThresholdHelpers = {
  /**
   * Evaluates APR performance level
   * @param apr - APR in decimal format (0.05 = 5%)
   * @returns Performance level: "high" | "acceptable" | "critical"
   */
  evaluateAPR(apr: number): "high" | "acceptable" | "critical" {
    if (apr >= APR_THRESHOLDS.HIGH) return "high";
    if (apr >= APR_THRESHOLDS.LOW) return "acceptable";
    return "critical";
  },

  /**
   * Evaluates yield data confidence level
   * @param daysWithData - Number of days with yield data
   * @returns Confidence level: "insufficient" | "low" | "normal"
   */
  evaluateYieldConfidence(
    daysWithData: number
  ): "insufficient" | "low" | "normal" {
    if (daysWithData < YIELD_DATA_THRESHOLDS.MIN_DAYS_FOR_PRELIMINARY) {
      return "insufficient";
    }
    if (daysWithData < YIELD_DATA_THRESHOLDS.MIN_DAYS_FOR_CONFIDENCE) {
      return "low";
    }
    return "normal";
  },

  /**
   * Gets color class for APR value
   * @param apr - APR in decimal format
   * @returns Tailwind CSS color class
   */
  getAPRColorClass(apr: number): string {
    const level = this.evaluateAPR(apr);
    switch (level) {
      case "high":
        return "text-green-500";
      case "acceptable":
        return "text-yellow-500";
      case "critical":
        return "text-red-500";
    }
  },
} as const;

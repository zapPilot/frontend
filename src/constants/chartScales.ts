/**
 * Chart dimension and scale configuration
 * Centralizes 15+ hardcoded magic numbers with documentation
 */

/**
 * Standard chart dimensions used across all chart components
 */
export const CHART_DIMENSIONS = {
  /** Chart width in pixels */
  WIDTH: 800,
  /** Chart height in pixels */
  HEIGHT: 300,
  /** Standard padding around charts */
  PADDING: 10,
  /** Additional offset for drawdown chart top */
  DRAWDOWN_TOP_OFFSET: 50,

  /** Computed drawdown chart height */
  get DRAWDOWN_HEIGHT() {
    return this.HEIGHT - this.DRAWDOWN_TOP_OFFSET;
  },

  /** Standard viewBox string for SVG elements */
  get VIEWBOX() {
    return `0 0 ${this.WIDTH} ${this.HEIGHT}`;
  },
} as const;

/**
 * Chart scale configurations with business rationale
 * Each scale documents the reasoning behind min/max values
 */
export const CHART_SCALES = {
  /**
   * Sharpe Ratio scale
   * Rationale: Industry standard risk-adjusted return metric
   * - >2.0 = Excellent (rare in crypto)
   * - 1.0-2.0 = Good (solid performance)
   * - 0.5-1.0 = Fair (acceptable)
   * - <0.5 = Poor (high risk for return)
   */
  SHARPE: {
    MIN: 0,
    MAX: 2.5,
    IDEAL: 1.0,
    RATIONALE:
      "Industry standard: >2.0 excellent, 1.0-2.0 good, 0.5-1.0 fair, <0.5 poor",
  },

  /**
   * Volatility scale (annualized percentage)
   * Rationale: Crypto assets typically show 15-35% volatility
   * - <10% = Very stable (rare)
   * - 10-15% = Low volatility
   * - 15-25% = Normal crypto volatility
   * - 25-35% = High volatility
   * - >35% = Extreme volatility
   */
  VOLATILITY: {
    MIN: 10,
    MAX: 40,
    WARNING_THRESHOLD: 25,
    RATIONALE:
      "Annualized % - crypto typical range 15-35%, >25% considered high risk",
  },

  /**
   * Underwater/Drawdown scale (negative percentage)
   * Rationale: Most portfolios recover from drawdowns <20%
   * - 0 to -5% = Minor correction
   * - -5 to -10% = Moderate drawdown
   * - -10 to -20% = Significant drawdown
   * - <-20% = Severe drawdown (recovery uncertain)
   */
  UNDERWATER: {
    MIN: -20,
    MAX: 0,
    SEVERE_THRESHOLD: -10,
    RATIONALE:
      "Drawdown % - most portfolios recover within -20%, >-10% is severe",
  },
} as const;

/**
 * Clamp value to scale bounds with warning
 * @param value - Value to clamp
 * @param scale - Scale with MIN and MAX properties
 * @returns Clamped value
 */
export const clampToScale = (
  value: number,
  scale: { MIN: number; MAX: number }
) => {
  const clamped = Math.max(scale.MIN, Math.min(scale.MAX, value));
  if (clamped !== value) {
    console.warn(
      `Chart value ${value} clamped to [${scale.MIN}, ${scale.MAX}]`
    );
  }
  return clamped;
};

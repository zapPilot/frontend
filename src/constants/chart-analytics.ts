/**
 * Chart Analytics Constants
 *
 * Constants for chart dimensions, scales, thresholds, and styling.
 * Originally from PortfolioChart component module, migrated for broader reuse.
 *
 * @module constants/chart-analytics
 */

/**
 * Chart dimension and layout constants
 * Defines standard chart dimensions used across all chart types
 */
export const CHART_DIMENSIONS = {
  WIDTH: 800,
  HEIGHT: 300,
  PADDING: 10,
} as const;

/**
 * Drawdown chart specific constants
 * Defines thresholds and layout for drawdown visualization
 */
export const DRAWDOWN_CONSTANTS = {
  TOP_OFFSET: 50,
  CHART_HEIGHT: 250, // CHART_HEIGHT (300) - TOP_OFFSET (50)
  DEFAULT_MIN: -20,
  DEFAULT_MAX: 0,
  RECOVERY_THRESHOLD: -0.5, // -0.5% threshold for "underwater" status
  LINE_COLOR: "#f97316",
  AREA_GRADIENT: {
    COLOR: "#f97316",
    START_OPACITY: 0,
    END_OPACITY: 0.45,
  },
  RECOVERY: {
    COLOR: "#10b981",
    MARKER_RADIUS: 5,
    LINE_DASH: "3,3",
    LINE_OPACITY: 0.6,
  },
  ZERO_LINE: {
    COLOR: "#374151",
    DASH: "2,2",
  },
  HISTORICAL_FILL: {
    COLOR: "#64748b",
    OPACITY: 0.3,
  },
} as const;

/**
 * Sharpe ratio chart scale constants
 * Defines the Y-axis scale for Sharpe ratio visualization
 * DeFi-adjusted range: -1.0 to 3.5 (allows negative Sharpe and high performers)
 */
export const SHARPE_CONSTANTS = {
  MIN_VALUE: -1.0,
  MAX_VALUE: 3.5,
  GOOD_THRESHOLD: 1.0, // Reference line for "good" Sharpe ratio
} as const;

/**
 * Volatility chart scale constants
 * Defines the Y-axis scale for volatility percentage visualization
 * DeFi-adjusted range: 5-100% (realistic for 24/7 crypto markets)
 */
export const VOLATILITY_CONSTANTS = {
  MIN_VALUE: 5, // 5% minimum volatility (stablecoin-heavy portfolios)
  MAX_VALUE: 100, // 100% maximum volatility (crypto-heavy DeFi portfolios)
} as const;

/**
 * Allocation chart constants
 * Defines scale for 100% stacked allocation chart
 */
export const ALLOCATION_CONSTANTS = {
  MIN_VALUE: 0,
  MAX_VALUE: 100, // 100% allocation
} as const;

/**
 * Chart animation constants
 * Used for smooth transitions and hover effects
 */
export const CHART_ANIMATION = {
  DURATION: 0.2,
  EASE: "easeInOut",
  INITIAL_DELAY: 0.1,
} as const;

/**
 * Chart stroke and styling constants
 * Defines consistent stroke widths and opacity values
 */
export const CHART_STYLING = {
  LINE_WIDTH: 2.5,
  LINE_WIDTH_BOLD: 3,
  GLOW_WIDTH: 4,
  SEPARATOR_WIDTH: 1,
  SEPARATOR_OPACITY: 0.4,
  GRID_OPACITY: 0.6,
  HOVER_OPACITY: 0.8,
} as const;

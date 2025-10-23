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
} as const;

/**
 * Sharpe ratio chart scale constants
 * Defines the Y-axis scale for Sharpe ratio visualization
 */
export const SHARPE_CONSTANTS = {
  MIN_VALUE: 0,
  MAX_VALUE: 2.5,
  GOOD_THRESHOLD: 1.0, // Reference line for "good" Sharpe ratio
} as const;

/**
 * Volatility chart scale constants
 * Defines the Y-axis scale for volatility percentage visualization
 */
export const VOLATILITY_CONSTANTS = {
  MIN_VALUE: 10, // 10% minimum volatility
  MAX_VALUE: 40, // 40% maximum volatility
} as const;

/**
 * Underwater chart scale constants
 * Defines the Y-axis scale for underwater recovery visualization
 */
export const UNDERWATER_CONSTANTS = {
  MIN_VALUE: -20, // -20% maximum drawdown
  MAX_VALUE: 0, // 0% = at peak
  RECOVERY_THRESHOLD: -0.5, // -0.5% threshold for "underwater" status
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

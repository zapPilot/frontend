/**
 * Chart Analytics Constants
 *
 * Constants for chart dimensions, scales, thresholds, and styling.
 * Originally from PortfolioChart component module, migrated for broader reuse.
 *
 * @module constants/chart-analytics
 */


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



/**
 * Chart Default Constants
 *
 * Default configuration values for chart components across the application.
 * Provides consistent chart behavior and time period selections.
 */

/**
 * Available time period options for chart data
 */
export const CHART_PERIODS = ["1M", "3M", "6M", "1Y", "ALL"] as const;

/**
 * Default time period selection
 */
export const DEFAULT_CHART_PERIOD = "3M" as const;

/**
 * Chart dimension defaults
 */
export const CHART_DIMENSIONS = {
  /** Default chart height in pixels */
  DEFAULT_HEIGHT: 400,

  /** Default chart width in pixels (or "100%" for responsive) */
  DEFAULT_WIDTH: "100%",

  /** Default chart padding for axis labels and margins */
  DEFAULT_PADDING: 10,

  /** Default aspect ratio (16:9) */
  DEFAULT_ASPECT_RATIO: 16 / 9,
} as const;

/**
 * Chart color defaults
 */
export const CHART_COLORS = {
  /** Primary line color (portfolio) */
  PRIMARY: "#8B5CF6",

  /** Secondary line color (benchmark) */
  SECONDARY: "#EC4899",

  /** Grid line color */
  GRID: "rgba(255, 255, 255, 0.1)",

  /** Axis text color */
  AXIS_TEXT: "rgba(255, 255, 255, 0.6)",
} as const;

/**
 * Type helper for chart periods
 */
export type ChartPeriod = (typeof CHART_PERIODS)[number];

import { CHART_DIMENSIONS, DRAWDOWN_CONSTANTS } from "./chartConstants";

/**
 * Calculate X position for a data point in the chart
 * Handles both single-point and multi-point datasets
 */
export function calculateXPosition(
  index: number,
  totalPoints: number,
  chartWidth: number = CHART_DIMENSIONS.WIDTH
): number {
  if (totalPoints <= 1) {
    return chartWidth / 2;
  }
  return (index / (totalPoints - 1)) * chartWidth;
}

/**
 * Calculate Y position for drawdown chart
 * Handles the special offset and scaling for drawdown visualization
 */
export function calculateDrawdownY(
  value: number,
  scaleDenominator: number
): number {
  if (!Number.isFinite(value)) {
    return DRAWDOWN_CONSTANTS.TOP_OFFSET + DRAWDOWN_CONSTANTS.CHART_HEIGHT;
  }

  const normalized =
    scaleDenominator !== 0
      ? (value - DRAWDOWN_CONSTANTS.DEFAULT_MAX) / scaleDenominator
      : 0;

  const rawY =
    DRAWDOWN_CONSTANTS.TOP_OFFSET +
    normalized * DRAWDOWN_CONSTANTS.CHART_HEIGHT;

  return Math.min(
    DRAWDOWN_CONSTANTS.TOP_OFFSET + DRAWDOWN_CONSTANTS.CHART_HEIGHT,
    Math.max(DRAWDOWN_CONSTANTS.TOP_OFFSET, rawY)
  );
}

/**
 * Calculate drawdown scale denominator
 * Handles zero-division edge cases
 */
export function calculateDrawdownScaleDenominator(minValue: number): number {
  const denominator = minValue - DRAWDOWN_CONSTANTS.DEFAULT_MAX;
  return denominator !== 0 ? denominator : DRAWDOWN_CONSTANTS.DEFAULT_MIN;
}

/**
 * Calculate drawdown minimum value from data
 * Rounds to nearest 5% and applies default minimum
 */
export function calculateDrawdownMinValue(drawdownValues: number[]): number {
  if (drawdownValues.length === 0) {
    return DRAWDOWN_CONSTANTS.DEFAULT_MIN;
  }

  const rawMin = Math.min(...drawdownValues);

  if (!Number.isFinite(rawMin)) {
    return DRAWDOWN_CONSTANTS.DEFAULT_MIN;
  }

  const roundedMin = Math.floor(rawMin / 5) * 5;
  return Math.min(roundedMin, DRAWDOWN_CONSTANTS.DEFAULT_MIN);
}

/**
 * Calculate Y position for a value in a standard chart
 * Generic helper for performance, sharpe, volatility charts
 */
export function calculateChartY(
  value: number,
  minValue: number,
  maxValue: number,
  chartHeight: number = CHART_DIMENSIONS.HEIGHT,
  chartPadding: number = CHART_DIMENSIONS.PADDING
): number {
  const range = maxValue - minValue;
  if (range === 0) return chartHeight / 2;

  const normalized = (value - minValue) / range;
  return (
    chartHeight - chartPadding - normalized * (chartHeight - 2 * chartPadding)
  );
}

/**
 * Generate SVG path for a line chart
 * Consolidates the common pattern of mapping data points to SVG path commands
 */
export function generateLineChartPath(
  dataPoints: { x: number; y: number }[]
): string {
  if (dataPoints.length === 0) return "";

  return dataPoints
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x} ${point.y}`;
    })
    .join(" ");
}

/**
 * Generate SVG path for an area chart (line + fill to baseline)
 * Common pattern for charts with filled areas below the line
 */
export function generateAreaChartPath(
  dataPoints: { x: number; y: number }[],
  baselineY: number,
  chartWidth: number = CHART_DIMENSIONS.WIDTH
): string {
  if (dataPoints.length === 0) return "";

  const linePath = dataPoints
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x} ${point.y}`;
    })
    .join(" ");

  return `M 0 ${baselineY} ${linePath} L ${chartWidth} ${baselineY} Z`;
}

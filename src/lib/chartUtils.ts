import { PortfolioDataPoint } from "../types/portfolio";
import { portfolioStateUtils } from "../utils/portfolio.utils";

export interface SVGPathPoint {
  x: number;
  y: number;
}

export const generateSVGPath = (
  data: PortfolioDataPoint[],
  getValue: (point: PortfolioDataPoint) => number,
  width = 800,
  height = 300,
  padding = 20
): string => {
  if (portfolioStateUtils.isEmptyArray(data)) return "";

  const values = data.map(getValue);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = Math.max(maxValue - minValue, 1);

  const points = data.map((point, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y =
      height -
      padding -
      ((getValue(point) - minValue) / valueRange) * (height - 2 * padding);
    return { x, y };
  });

  return points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    )
    .join(" ");
};

export const generateAreaPath = (
  data: PortfolioDataPoint[],
  getValue: (point: PortfolioDataPoint) => number,
  width = 800,
  height = 300,
  padding = 20
): string => {
  const linePath = generateSVGPath(data, getValue, width, height, padding);
  if (!linePath) return "";

  return `${linePath} L ${width} ${height - padding} L 0 ${height - padding} Z`;
};

export const formatAxisLabel = (
  value: number,
  type: "currency" | "percentage" = "currency"
): string => {
  if (type === "percentage") {
    return `${value.toFixed(1)}%`;
  }

  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }

  return `$${value.toFixed(0)}`;
};

export const generateYAxisLabels = (
  minValue: number,
  maxValue: number,
  steps = 5
): number[] => {
  const range = maxValue - minValue;
  const stepSize = range / (steps - 1);

  return Array.from({ length: steps }, (_, i) => maxValue - i * stepSize);
};

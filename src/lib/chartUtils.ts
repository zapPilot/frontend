import { PortfolioDataPoint, AssetAllocationPoint } from "../types/portfolio";
import { portfolioStateUtils } from "@/utils/portfolio.utils";

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

export interface AllocationChartPoint {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  assetKey: string;
  value: number;
}

export const generateAllocationChartData = (
  data: AssetAllocationPoint[],
  width = 800,
  height = 300
): AllocationChartPoint[] => {
  if (portfolioStateUtils.isEmptyArray(data)) return [];

  const assets = [
    { key: "btc", color: "#f59e0b" },
    { key: "eth", color: "#6366f1" },
    { key: "stablecoin", color: "#10b981" },
    { key: "defi", color: "#8b5cf6" },
    { key: "altcoin", color: "#ef4444" },
  ];

  const chartPoints: AllocationChartPoint[] = [];

  data.forEach((point, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const total =
      point.btc + point.eth + point.stablecoin + point.defi + point.altcoin;
    let yOffset = height;

    assets.forEach(asset => {
      const value = point[asset.key as keyof AssetAllocationPoint] as number;
      const assetHeight = (value / total) * height;
      const y = yOffset - assetHeight;
      yOffset -= assetHeight;

      chartPoints.push({
        x: x - 2,
        y,
        width: 4,
        height: assetHeight,
        color: asset.color,
        assetKey: asset.key,
        value,
      });
    });
  });

  return chartPoints;
};

export const safeDivision = (
  numerator: number,
  denominator: number,
  fallback = 1
): number => {
  return denominator === 0 ? fallback : numerator / denominator;
};

import {
  ALLOCATION_STACK_ORDER,
  ASSET_LABELS,
  CHART_COLORS,
} from "../constants/portfolio";
import { AssetAllocationPoint, PortfolioDataPoint } from "../types/portfolio";
import { portfolioStateUtils } from "../utils/portfolio.utils";

export interface SVGPathPoint {
  x: number;
  y: number;
}

type AllocationAssetKey = Exclude<keyof AssetAllocationPoint, "date">;

const ALLOCATION_BAR_OFFSET = 2;
const ALLOCATION_BAR_WIDTH = 4;

export interface AllocationChartPoint {
  date: string;
  assetKey: AllocationAssetKey;
  value: number;
  percentage: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
}

export const safeDivision = (
  numerator: number,
  denominator: number,
  fallback = 1
): number => {
  if (denominator === 0) {
    return fallback;
  }

  const result = numerator / denominator;
  if (!Number.isFinite(result)) {
    return fallback;
  }

  return result;
};

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

export const generateAllocationChartData = (
  data: AssetAllocationPoint[],
  width = 800,
  height = 300
): AllocationChartPoint[] => {
  if (portfolioStateUtils.isEmptyArray(data)) {
    return [];
  }

  const spacing = data.length > 1 ? width / (data.length - 1) : 0;

  return data.flatMap((point, index) => {
    const sanitizedValues: Record<AllocationAssetKey, number> = {
      btc: Math.max(point.btc ?? 0, 0),
      eth: Math.max(point.eth ?? 0, 0),
      stablecoin: Math.max(point.stablecoin ?? 0, 0),
      altcoin: Math.max(point.altcoin ?? 0, 0),
    };

    const totalValue = ALLOCATION_STACK_ORDER.reduce(
      (sum, key) => sum + sanitizedValues[key],
      0
    );

    const xPosition = spacing * index - ALLOCATION_BAR_OFFSET;
    let cumulativeHeight = 0;

    return ALLOCATION_STACK_ORDER.map(assetKey => {
      const value = sanitizedValues[assetKey];
      const share = safeDivision(value, totalValue, 0);
      const segmentHeight = share * height;
      const y = height - cumulativeHeight - segmentHeight;

      cumulativeHeight += segmentHeight;

      return {
        date: point.date,
        assetKey,
        value,
        percentage: share * 100,
        x: xPosition,
        y,
        width: ALLOCATION_BAR_WIDTH,
        height: segmentHeight,
        color: CHART_COLORS[assetKey],
        label: ASSET_LABELS[assetKey],
      } satisfies AllocationChartPoint;
    });
  });
};

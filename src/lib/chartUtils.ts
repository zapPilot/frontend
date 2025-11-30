import { PieChartData, PortfolioDataPoint } from "@/types/domain/portfolio";

import {
  API_CATEGORY_KEY_MAP,
  type ApiCategoryKey,
  ASSET_CATEGORIES,
} from "../constants/portfolio";
import { formatLargeNumber, formatPercentage } from "./formatters";

/**
 * Generate SVG path for line chart from portfolio data points
 * Scales data points to fit within specified dimensions
 */
export const generateSVGPath = (
  data: PortfolioDataPoint[],
  getValue: (point: PortfolioDataPoint) => number,
  width = 800,
  height = 300,
  padding = 20
): string => {
  if (!data || data.length === 0) return "";

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

export const formatAxisLabel = (
  value: number,
  type: "currency" | "percentage" = "currency"
): string => {
  if (type === "percentage") {
    return formatPercentage(value, false, 1);
  }

  // For currency, use formatLargeNumber which already handles K/M/B
  if (value >= 1000) {
    return `$${formatLargeNumber(value, 0)}`;
  }

  return `$${Math.round(value)}`;
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

const DEFAULT_PIE_SLICE_COLOR = "#6366F1";

const isApiCategoryKey = (categoryId: string): categoryId is ApiCategoryKey =>
  Object.prototype.hasOwnProperty.call(API_CATEGORY_KEY_MAP, categoryId);

interface PieChartTransformItem {
  id: string;
  value: number;
  percentage?: number;
  label?: string;
  color?: string;
}

interface TransformPieChartOptions {
  deriveCategoryMetadata?: boolean;
  colorVariant?: "brand" | "chart";
}

export const transformToPieChartData = (
  items: PieChartTransformItem[],
  options: TransformPieChartOptions = {}
): PieChartData[] => {
  const { deriveCategoryMetadata = false, colorVariant = "brand" } = options;

  const positiveItems = items.filter(item => item.value > 0);
  const totalValue = positiveItems.reduce((sum, item) => sum + item.value, 0);

  return positiveItems.map(item => {
    const categoryMeta =
      deriveCategoryMetadata && isApiCategoryKey(item.id)
        ? ASSET_CATEGORIES[API_CATEGORY_KEY_MAP[item.id]]
        : null;

    const percentage =
      item.percentage !== undefined
        ? item.percentage
        : totalValue > 0
          ? (item.value / totalValue) * 100
          : 0;

    const color =
      item.color ??
      (categoryMeta
        ? colorVariant === "chart"
          ? categoryMeta.chartColor
          : categoryMeta.brandColor
        : DEFAULT_PIE_SLICE_COLOR);

    return {
      label: item.label ?? categoryMeta?.label ?? item.id,
      value: item.value,
      percentage,
      color,
    };
  });
};

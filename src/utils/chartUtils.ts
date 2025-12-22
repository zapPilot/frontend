import { PieChartData } from "@/types/domain/portfolio";

import {
    API_CATEGORY_KEY_MAP,
    type ApiCategoryKey,
    ASSET_CATEGORIES,
} from "../constants/portfolio";

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

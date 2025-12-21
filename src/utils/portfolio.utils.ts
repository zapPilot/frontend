/**
 * Category summary utilities for unified landing page data
 *
 * Functions to transform pool_details from landing-page API into category summaries
 * for progressive disclosure UX (show summaries on landing, full details in analytics)
 */

/**
 * Categorize pool details by asset type based on symbols
 */
import { ASSET_SYMBOL_SETS } from "@/constants/assetSymbols";
import {
  API_CATEGORY_KEY_MAP,
  type ApiCategoryKey,
  ASSET_CATEGORIES,
} from "@/constants/portfolio";
import type { PieChartData } from "@/types/domain/portfolio";
import { transformToPieChartData } from "@/utils/chartUtils";

export interface CategorySummary {
  id: string;
  name: string;
  color: string;
  totalValue: number;
  percentage: number;
  averageAPR: number;
  // Removed poolCount as this data is no longer provided by the unified API
  topProtocols: {
    name: string;
    value: number;
    count: number;
  }[];
}

interface PortfolioCategoryInput {
  id: ApiCategoryKey;
  value: number;
  percentage?: number;
}

interface TransformPortfolioCategoriesResult {
  summaries: CategorySummary[];
  pieChartData: PieChartData[];
}

interface TransformPortfolioCategoriesOptions {
  totalValue?: number;
  colorVariant?: "brand" | "chart";
}

export function transformPortfolioCategories(
  categories: PortfolioCategoryInput[],
  options: TransformPortfolioCategoriesOptions = {}
): TransformPortfolioCategoriesResult {
  const { totalValue, colorVariant = "brand" } = options;

  const positiveCategories = categories.filter(category => category.value > 0);
  const effectiveTotal =
    totalValue !== undefined
      ? totalValue
      : positiveCategories.reduce((sum, category) => sum + category.value, 0);

  const computedCategories = positiveCategories.map(category => {
    const percentage =
      category.percentage !== undefined
        ? category.percentage
        : effectiveTotal > 0
          ? (category.value / effectiveTotal) * 100
          : 0;

    return {
      ...category,
      percentage,
    };
  });

  const pieChartData = transformToPieChartData(
    computedCategories.map(category => ({
      id: category.id,
      value: category.value,
      percentage: category.percentage,
    })),
    { deriveCategoryMetadata: true, colorVariant }
  );

  const summaries = computedCategories
    .map(category => {
      const assetKey = API_CATEGORY_KEY_MAP[category.id];
      const categoryMeta = ASSET_CATEGORIES[assetKey];

      return {
        id: category.id,
        name: categoryMeta.label,
        color:
          colorVariant === "chart"
            ? categoryMeta.chartColor
            : categoryMeta.brandColor,
        totalValue: category.value,
        percentage: category.percentage,
        averageAPR: 0,
        topProtocols: [],
      } satisfies CategorySummary;
    })
    .sort((a, b) => b.totalValue - a.totalValue);

  return { summaries, pieChartData };
}

export function categorizePool(poolSymbols: string[]): ApiCategoryKey {
  const symbols = poolSymbols.map(s => s.toLowerCase());

  if (symbols.some(s => ASSET_SYMBOL_SETS.btc.has(s))) return "btc";
  if (symbols.some(s => ASSET_SYMBOL_SETS.eth.has(s))) return "eth";
  if (symbols.some(s => ASSET_SYMBOL_SETS.stablecoins.has(s)))
    return "stablecoins";
  return "others";
}

// Unused export removed: createCategoriesFromApiData

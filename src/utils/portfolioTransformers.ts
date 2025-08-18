import type {
  ApiCategory,
  ApiPortfolioSummary,
  ApiPosition,
} from "../schemas/portfolioApi";
import type { AssetCategory, AssetDetail } from "../types/portfolio";
import {
  transformForDisplay,
  type BorrowingDisplayData,
} from "./borrowingUtils";
import { getCategoryColor, getCategoryDisplayName } from "./categoryUtils";

/**
 * Transform API positions to AssetDetail format
 */
function transformApiPosition(position: ApiPosition): AssetDetail {
  return {
    name: position.symbol?.toUpperCase() || "Unknown",
    symbol: position.symbol || "UNK",
    protocol: position.protocol_name || "Unknown",
    amount: position.amount || 0,
    value: position.total_usd_value || 0,
    apr: 0, // TODO: Backend needs to provide real APR data - currently shows "APR coming soon" in UI
    type: position.protocol_type || "Unknown",
  };
}

/**
 * Transform API category to AssetCategory format
 */
function transformApiCategory(
  apiCategory: ApiCategory,
  index: number,
  totalValue: number
): AssetCategory {
  const categoryTotal =
    apiCategory.positions?.reduce(
      (sum, pos) => sum + (pos.total_usd_value || 0),
      0
    ) || 0;

  return {
    id: apiCategory.category || `category-${index}`,
    name: getCategoryDisplayName(apiCategory.category || "Unknown"),
    color: getCategoryColor(apiCategory.category || "others"),
    totalValue: categoryTotal,
    percentage: totalValue > 0 ? (categoryTotal / totalValue) * 100 : 0,
    change24h: 0, // API doesn't provide this, set to 0
    assets: apiCategory.positions?.map(transformApiPosition) || [],
  };
}

/**
 * Transform data to pie chart format for visualization
 */
export function toPieChartData(
  data: AssetCategory[],
  totalValue?: number
): { label: string; value: number; percentage: number; color: string }[] {
  return data.map(cat => ({
    label: cat.name,
    value:
      totalValue && cat.percentage
        ? (cat.percentage / 100) * totalValue
        : cat.totalValue,
    percentage: cat.percentage,
    color: cat.color,
  }));
}

/**
 * Comprehensive portfolio data preparation utility
 * Handles all common data transformation patterns in one place
 */
export function preparePortfolioData(
  apiCategoriesData: AssetCategory[] | null,
  totalValue: number | null
) {
  // Safe data preparation - handle null/undefined gracefully
  const portfolioData = apiCategoriesData || [];

  // Transform to pie chart format - handle null totalValue gracefully
  const pieChartData = toPieChartData(portfolioData, totalValue || undefined);

  return {
    portfolioData,
    pieChartData,
  };
}

/**
 * Enhanced portfolio data preparation with borrowing support
 * Separates assets from borrowing and provides all display data
 */
export function preparePortfolioDataWithBorrowing(
  apiCategoriesData: AssetCategory[] | null,
  _totalValue: number | null // eslint-disable-line @typescript-eslint/no-unused-vars -- Kept for API consistency
): {
  portfolioData: AssetCategory[];
  pieChartData: {
    label: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  borrowingData: BorrowingDisplayData;
} {
  // Safe data preparation - handle null/undefined gracefully
  const portfolioData = apiCategoriesData || [];

  // Get borrowing-aware display data
  const borrowingData = transformForDisplay(portfolioData);

  // Create pie chart data from assets only (positive values)
  const pieChartData = borrowingData.assetsPieData;

  return {
    portfolioData,
    pieChartData,
    borrowingData,
  };
}

/**
 * Portfolio state management utilities
 * Consolidates common state reset and validation patterns
 */
export const portfolioStateUtils = {
  /**
   * Reset portfolio state to initial/error state
   * Common pattern for error handling and initialization
   */
  resetState: () => ({
    totalValue: null as number | null,
    categories: null as AssetCategory[] | null,
  }),

  /**
   * Check if portfolio data is in a loading/empty state
   */
  isEmpty: (categories: AssetCategory[] | null, totalValue: number | null) => {
    return !categories || categories.length === 0 || !totalValue;
  },

  /**
   * Check if portfolio data is valid and ready for display
   */
  isValid: (categories: AssetCategory[] | null, totalValue: number | null) => {
    return (
      categories &&
      categories.length > 0 &&
      totalValue !== null &&
      totalValue > 0
    );
  },

  /**
   * Safe array length check - prevents redundant .length === 0 patterns
   */
  hasItems: <T>(array: T[] | null | undefined): array is T[] => {
    return Array.isArray(array) && array.length > 0;
  },

  /**
   * Safe empty array check - consolidated null/undefined/empty checking
   */
  isEmptyArray: <T>(array: T[] | null | undefined): boolean => {
    return !Array.isArray(array) || array.length === 0;
  },
} as const;

/**
 * Transform complete API response to frontend format
 */
export function transformPortfolioSummary(apiResponse: ApiPortfolioSummary): {
  totalValue: number;
  categories: AssetCategory[];
} {
  const totalValue =
    apiResponse.categories?.reduce(
      (sum, cat) =>
        sum +
        (cat.positions?.reduce(
          (catSum, pos) => catSum + (pos.total_usd_value || 0),
          0
        ) || 0),
      0
    ) || 0;

  const categories =
    apiResponse.categories?.map((cat, index) =>
      transformApiCategory(cat, index, totalValue)
    ) || [];

  return {
    totalValue,
    categories,
  };
}

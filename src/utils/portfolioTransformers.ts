import type { AssetCategory, AssetDetail } from "../types/portfolio";
import { getCategoryColor, getCategoryDisplayName } from "./categoryUtils";
import type {
  ApiPortfolioSummary,
  ApiCategory,
  ApiPosition,
} from "../schemas/portfolioApi";

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
    apr: 0, // Placeholder - backend needs to provide APR
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

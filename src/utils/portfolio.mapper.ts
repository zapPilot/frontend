import type {
  ApiCategory,
  ApiPortfolioSummary,
  ApiPosition,
} from "../schemas/portfolioApi";
import type { AssetCategory, AssetDetail } from "../types/portfolio";
import { getCategoryColor, getCategoryDisplayName } from "./categoryUtils";

/**
 * Transform API position to AssetDetail format
 *
 * Converts raw API position data to the standardized AssetDetail interface
 * used throughout the frontend for consistent data handling.
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
 *
 * Converts API category data to the frontend AssetCategory format with
 * proper color assignment, display names, and percentage calculations.
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
 * Transform complete API response to frontend format
 *
 * Handles both legacy categories structure and new asset_positions/borrowing_positions structure.
 * This is the main transformation function that processes the entire API response into
 * the format expected by the frontend components.
 *
 * @param apiResponse - Raw API response from the portfolio service
 * @returns Transformed data with totalValue and categories for frontend consumption
 */
export function transformPortfolioSummary(apiResponse: ApiPortfolioSummary): {
  totalValue: number;
  categories: AssetCategory[];
} {
  let categories: AssetCategory[] = [];
  let totalValue = 0;

  // Handle new separated structure
  if (apiResponse.asset_positions && apiResponse.borrowing_positions) {
    // Calculate total value from assets only (positive values)
    const assetValue = apiResponse.asset_positions.reduce(
      (sum, cat) =>
        sum +
        (cat.positions?.reduce(
          (catSum, pos) => catSum + Math.max(0, pos.total_usd_value || 0),
          0
        ) || 0),
      0
    );

    // Calculate total borrowing value (should be positive in the new structure)
    const borrowingValue = apiResponse.borrowing_positions.reduce(
      (sum, cat) =>
        sum +
        (cat.positions?.reduce(
          (catSum, pos) => catSum + Math.abs(pos.total_usd_value || 0),
          0
        ) || 0),
      0
    );

    // Net value for percentage calculations
    totalValue = assetValue;

    // Transform asset positions
    const assetCategories = apiResponse.asset_positions.map((cat, index) =>
      transformApiCategory(cat, index, assetValue)
    );

    // Transform borrowing positions (mark them as negative for internal processing)
    const borrowingCategories = apiResponse.borrowing_positions.map(
      (cat, index) => {
        const category = transformApiCategory(
          cat,
          index + assetCategories.length,
          borrowingValue
        );
        // Mark as negative values for internal borrowing logic
        category.totalValue = -Math.abs(category.totalValue);
        category.assets = category.assets.map(asset => ({
          ...asset,
          value: -Math.abs(asset.value),
          amount: asset.amount, // Keep amount positive for display
        }));
        return category;
      }
    );

    categories = [...assetCategories, ...borrowingCategories];
  }
  // Handle legacy structure
  else if (apiResponse.categories) {
    totalValue = apiResponse.categories.reduce(
      (sum, cat) =>
        sum +
        (cat.positions?.reduce(
          (catSum, pos) => catSum + (pos.total_usd_value || 0),
          0
        ) || 0),
      0
    );

    categories = apiResponse.categories.map((cat, index) =>
      transformApiCategory(cat, index, totalValue)
    );
  }

  return {
    totalValue,
    categories,
  };
}

import type { AssetCategory } from "../types/portfolio";
import {
  transformForDisplay,
  validatePieChartWeights,
  type BorrowingDisplayData,
} from "./borrowingUtils";

/**
 * Enhanced portfolio data preparation with borrowing support
 *
 * Separates assets from borrowing and provides all display data.
 * This version is borrowing-aware and provides accurate pie chart weights.
 *
 * @deprecated Use the unified useLandingPageData hook instead - server provides pre-formatted data
 * @param apiCategoriesData - Portfolio category data from API
 * @param _totalValue - Total portfolio value (unused but kept for interface compatibility)
 * @param debugContext - Optional debug context for validation logging
 * @returns Complete portfolio display data including borrowing separation
 */
export function preparePortfolioDataWithBorrowing(
  apiCategoriesData: AssetCategory[] | null,
  _totalValue: number | null,
  debugContext?: string
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

  // Validate pie chart weights
  if (debugContext && pieChartData.length > 0) {
    validatePieChartWeights(pieChartData, debugContext);
  }

  return {
    portfolioData,
    pieChartData,
    borrowingData,
  };
}

/**
 * Portfolio state management utilities
 *
 * Consolidates common state reset and validation patterns used throughout
 * the application for consistent portfolio state handling.
 */
export const portfolioStateUtils = {
  /**
   * Reset portfolio state to initial/error state
   *
   * Common pattern for error handling and initialization.
   * Returns a clean state object with null values.
   */
  resetState: () => ({
    totalValue: null as number | null,
    categories: null as AssetCategory[] | null,
  }),

  /**
   * Check if portfolio data is in a loading/empty state
   *
   * Useful for determining when to show loading indicators or empty states.
   *
   * @param categories - Portfolio categories array
   * @param totalValue - Total portfolio value
   * @returns True if data is empty or not loaded
   */
  isEmpty: (categories: AssetCategory[] | null, totalValue: number | null) => {
    return !categories || categories.length === 0 || !totalValue;
  },

  /**
   * Check if portfolio data is valid and ready for display
   *
   * Ensures data meets minimum requirements for rendering portfolio components.
   *
   * @param categories - Portfolio categories array
   * @param totalValue - Total portfolio value
   * @returns True if data is valid and ready for display
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
   *
   * Type-safe way to check if an array has items without null/undefined errors.
   *
   * @param array - Array to check
   * @returns Type-safe boolean indicating if array has items
   */
  hasItems: <T>(array: T[] | null | undefined): array is T[] => {
    return Array.isArray(array) && array.length > 0;
  },

  /**
   * Safe empty array check - consolidated null/undefined/empty checking
   *
   * Comprehensive check for empty, null, or undefined arrays.
   *
   * @param array - Array to check
   * @returns True if array is null, undefined, or empty
   */
  isEmptyArray: <T>(array: T[] | null | undefined): boolean => {
    return !Array.isArray(array) || array.length === 0;
  },
} as const;

/**
 * Category summary utilities for unified landing page data
 *
 * Functions to transform pool_details from landing-page API into category summaries
 * for progressive disclosure UX (show summaries on landing, full details in analytics)
 */

export interface CategorySummary {
  id: string;
  name: string;
  color: string;
  totalValue: number;
  percentage: number;
  averageAPR: number;
  // Removed poolCount as this data is no longer provided by the unified API
  topProtocols: Array<{
    name: string;
    value: number;
    count: number;
  }>;
}

export interface PoolDetail {
  snapshot_id: string;
  chain: string;
  protocol: string;
  protocol_name: string;
  asset_usd_value: number;
  pool_symbols: string[];
  final_apr: number;
  protocol_matched: boolean;
  apr_data: {
    apr_protocol: string | null;
    apr_symbol: string | null;
    apr: number | null;
    apr_base: number | null;
    apr_reward: number | null;
    apr_updated_at: string | null;
  };
  contribution_to_portfolio: number;
}

/**
 * Categorize pool details by asset type based on symbols
 */
import { ASSET_SYMBOL_SETS } from "@/constants/assetSymbols";

function categorizePool(
  poolSymbols: string[]
): "btc" | "eth" | "stablecoins" | "others" {
  const symbols = poolSymbols.map(s => s.toLowerCase());

  if (symbols.some(s => ASSET_SYMBOL_SETS.btc.has(s))) return "btc";
  if (symbols.some(s => ASSET_SYMBOL_SETS.eth.has(s))) return "eth";
  if (symbols.some(s => ASSET_SYMBOL_SETS.stablecoins.has(s)))
    return "stablecoins";
  return "others";
}

/**
 * Transform pool_details into category summaries for AssetCategoriesDetail
 */
export function createCategorySummaries(
  poolDetails: PoolDetail[],
  pieChartCategories: {
    btc: number;
    eth: number;
    stablecoins: number;
    others: number;
  },
  totalNetUsd: number
): CategorySummary[] {
  if (!poolDetails || poolDetails.length === 0) {
    return [];
  }

  // Group pools by category
  const categoryGroups: Record<string, PoolDetail[]> = {
    btc: [],
    eth: [],
    stablecoins: [],
    others: [],
  };

  poolDetails.forEach(pool => {
    if (pool?.pool_symbols && Array.isArray(pool.pool_symbols)) {
      const category = categorizePool(pool.pool_symbols);
      categoryGroups[category]?.push(pool);
    }
  });

  // Create summaries for each category
  const categories: CategorySummary[] = [];

  const categoryInfo = {
    btc: { name: "Bitcoin", color: "#F7931A" },
    eth: { name: "Ethereum", color: "#627EEA" },
    stablecoins: { name: "Stablecoins", color: "#26A69A" },
    others: { name: "Others", color: "#AB47BC" },
  };

  Object.entries(categoryGroups).forEach(([categoryId, pools]) => {
    if (pools.length === 0) return;

    const totalValue =
      pieChartCategories[categoryId as keyof typeof pieChartCategories];
    const percentage = totalNetUsd > 0 ? (totalValue / totalNetUsd) * 100 : 0;

    // Calculate average APR (weighted by value)
    const totalWeightedAPR = pools.reduce(
      (sum, pool) => sum + pool.final_apr * pool.asset_usd_value,
      0
    );
    const totalValue_calc = pools.reduce(
      (sum, pool) => sum + pool.asset_usd_value,
      0
    );
    const averageAPR =
      totalValue_calc > 0 ? totalWeightedAPR / totalValue_calc : 0;

    // Get top protocols by value
    const protocolTotals: Record<string, { value: number; count: number }> = {};
    pools.forEach(pool => {
      const protocol = pool.protocol_name || pool.protocol;
      if (!protocolTotals[protocol]) {
        protocolTotals[protocol] = { value: 0, count: 0 };
      }
      protocolTotals[protocol].value += pool.asset_usd_value;
      protocolTotals[protocol].count += 1;
    });

    const topProtocols = Object.entries(protocolTotals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    categories.push({
      id: categoryId,
      name: categoryInfo[categoryId as keyof typeof categoryInfo].name,
      color: categoryInfo[categoryId as keyof typeof categoryInfo].color,
      totalValue,
      percentage,
      averageAPR: averageAPR * 100, // Convert to percentage
      topProtocols,
    });
  });

  return categories.sort((a, b) => b.totalValue - a.totalValue);
}

/**
 * Create category summaries from unified API data structure
 * Works for both assets (pie_chart_categories) and debt (category_summary_debt)
 */
export function createCategoriesFromApiData(
  categoryData: {
    btc: number;
    eth: number;
    stablecoins: number;
    others: number;
  },
  totalValue: number
): CategorySummary[] {
  if (!categoryData) {
    return [];
  }

  const categoryInfo = {
    btc: { name: "Bitcoin", color: "#F7931A" },
    eth: { name: "Ethereum", color: "#627EEA" },
    stablecoins: { name: "Stablecoins", color: "#26A69A" },
    others: { name: "Others", color: "#AB47BC" },
  };

  return Object.entries(categoryData)
    .filter(([, value]) => value > 0) // Only include categories with value
    .map(([categoryId, value]) => {
      const info = categoryInfo[categoryId as keyof typeof categoryInfo];
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

      return {
        id: categoryId,
        name: info.name,
        color: info.color,
        totalValue: value,
        percentage,
        averageAPR: 0, // Not available in simplified API structure
        topProtocols: [], // Not available in simplified API structure
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue);
}

/**
 * Normalize APR value from API
 * Handles the heuristic: if value looks like 7.5% (>1.5), convert to decimal (0.075)
 * @param apr - Raw APR value from API
 * @returns Normalized decimal APR or undefined if invalid
 */
export function normalizeApr(apr?: number | null): number | undefined {
  if (typeof apr !== "number") {
    return undefined;
  }
  return apr / 100;
}

/**
 * Filter pool details by category for analytics tab
 */
export function filterPoolDetailsByCategory(
  poolDetails: PoolDetail[],
  categoryId: string
): PoolDetail[] {
  if (!poolDetails || poolDetails.length === 0) {
    return [];
  }

  return poolDetails.filter(pool => {
    const category = categorizePool(pool.pool_symbols);
    return category === categoryId;
  });
}

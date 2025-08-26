import type { AssetCategory } from "../types/portfolio";
import {
  transformForDisplay,
  validatePieChartWeights,
  type BorrowingDisplayData,
} from "./borrowingUtils";
import { toPieChartData } from "./chart.transformers";

/**
 * Comprehensive portfolio data preparation utility
 *
 * Handles all common data transformation patterns in one place.
 * This is the basic version without borrowing separation.
 *
 * @param apiCategoriesData - Portfolio category data from API
 * @param totalValue - Total portfolio value
 * @returns Processed portfolio data ready for display
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
 *
 * Separates assets from borrowing and provides all display data.
 * This version is borrowing-aware and provides accurate pie chart weights.
 *
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

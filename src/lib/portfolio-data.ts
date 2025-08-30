/**
 * Portfolio Data Processing Utilities
 *
 * Handles all portfolio data preparation, transformation, and state management.
 * Consolidates data processing logic from portfolio.utils.ts with clear
 * separation from mock data generation.
 *
 * @module lib/portfolio-data
 */

import type {
  AssetCategory,
  UnvalidatedAssetCategory,
  UnvalidatedPortfolioData,
} from "../types/portfolio";
import {
  transformForDisplay,
  validatePieChartWeights,
  type BorrowingDisplayData,
} from "../utils/borrowingUtils";
import { toPieChartData } from "../utils/chart.transformers";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface PortfolioDataResult {
  portfolioData: AssetCategory[];
  pieChartData: {
    label: string;
    value: number;
    percentage: number;
    color: string;
  }[];
}

export interface EnhancedPortfolioDataResult extends PortfolioDataResult {
  borrowingData: BorrowingDisplayData;
}

export interface PortfolioState {
  totalValue: number | null;
  categories: AssetCategory[] | null;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalChange24h: number;
  totalChangePercentage: number;
}

// =============================================================================
// DATA PREPARATION FUNCTIONS
// =============================================================================

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
): PortfolioDataResult {
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
): EnhancedPortfolioDataResult {
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

// =============================================================================
// PORTFOLIO CALCULATIONS
// =============================================================================

/**
 * Calculate portfolio metrics from asset categories
 *
 * @param categories - Array of asset categories with values and changes
 * @returns Calculated portfolio metrics
 */
export function calculatePortfolioMetrics(
  categories: Array<{ totalValue: number; change24h: number }>
): PortfolioMetrics {
  const totalValue = categories.reduce((sum, cat) => sum + cat.totalValue, 0);
  const totalChange24h = categories.reduce(
    (sum, cat) => sum + (cat.totalValue * cat.change24h) / 100,
    0
  );
  const totalChangePercentage =
    totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

  return {
    totalValue,
    totalChange24h,
    totalChangePercentage,
  };
}

/**
 * Calculate weighted average of a metric across portfolio categories
 *
 * @param categories - Portfolio categories
 * @param metricKey - Key of the metric to calculate weighted average for
 * @returns Weighted average value
 */
export function calculateWeightedAverage(
  categories: AssetCategory[],
  metricKey: keyof AssetCategory
): number {
  const totalValue = categories.reduce((sum, cat) => sum + cat.totalValue, 0);

  if (totalValue === 0) return 0;

  return categories.reduce((sum, cat) => {
    const weight = cat.totalValue / totalValue;
    const metricValue = cat[metricKey] as number;
    return sum + metricValue * weight;
  }, 0);
}

/**
 * Calculate portfolio diversification score
 * Based on Herfindahl-Hirschman Index (lower is more diversified)
 *
 * @param categories - Portfolio categories
 * @returns Diversification score (0-1, where 0 is perfectly diversified)
 */
export function calculateDiversificationScore(
  categories: AssetCategory[]
): number {
  const totalValue = categories.reduce((sum, cat) => sum + cat.totalValue, 0);

  if (totalValue === 0) return 0;

  const hhi = categories.reduce((sum, cat) => {
    const weight = cat.totalValue / totalValue;
    return sum + weight * weight;
  }, 0);

  // Convert HHI to 0-1 scale (1 = concentrated, 0 = diversified)
  return hhi;
}

// =============================================================================
// PORTFOLIO STATE MANAGEMENT
// =============================================================================

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
  resetState: (): PortfolioState => ({
    totalValue: null,
    categories: null,
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
  isEmpty: (
    categories: AssetCategory[] | null,
    totalValue: number | null
  ): boolean => {
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
  isValid: (
    categories: AssetCategory[] | null,
    totalValue: number | null
  ): boolean => {
    return !!(
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

  /**
   * Create loading state for async operations
   *
   * @returns Portfolio state indicating loading
   */
  loadingState: (): PortfolioState & { isLoading: true } => ({
    totalValue: null,
    categories: null,
    isLoading: true,
  }),

  /**
   * Create error state for failed operations
   *
   * @param error - Error message or object
   * @returns Portfolio state with error information
   */
  errorState: (error: string | Error): PortfolioState & { error: string } => ({
    totalValue: null,
    categories: null,
    error: error instanceof Error ? error.message : error,
  }),
} as const;

// =============================================================================
// DATA VALIDATION AND SANITIZATION
// =============================================================================

/**
 * Validate portfolio categories data
 *
 * @param categories - Categories to validate
 * @returns Validation result with cleaned data
 */
export function validatePortfolioCategories(
  categories: UnvalidatedAssetCategory[]
): {
  isValid: boolean;
  data: AssetCategory[];
  errors: string[];
} {
  const errors: string[] = [];
  const validData: AssetCategory[] = [];

  if (!Array.isArray(categories)) {
    errors.push("Categories must be an array");
    return { isValid: false, data: [], errors };
  }

  categories.forEach((category, index) => {
    try {
      // Basic required fields validation
      if (typeof category.name !== "string" || !category.name.trim()) {
        errors.push(`Category ${index}: name must be a non-empty string`);
        return;
      }

      if (
        typeof category.totalValue !== "number" ||
        isNaN(category.totalValue)
      ) {
        errors.push(`Category ${index}: totalValue must be a valid number`);
        return;
      }

      if (category.totalValue < 0) {
        errors.push(`Category ${index}: totalValue cannot be negative`);
        return;
      }

      // Create sanitized category
      const sanitizedCategory: AssetCategory = {
        id: category.id || category.name.toLowerCase().replace(/\s+/g, "-"), // Generate id from name if not provided
        name: category.name.trim(),
        totalValue: Math.max(0, Number(category.totalValue)),
        change24h: Number(category.change24h) || 0,
        percentage: Number(category.percentage) || 0,
        color: typeof category.color === "string" ? category.color : "#6B7280",
        assets: Array.isArray(category.assets) ? category.assets : [],
      };

      validData.push(sanitizedCategory);
    } catch (error) {
      errors.push(
        `Category ${index}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    data: validData,
    errors,
  };
}

/**
 * Sanitize portfolio data for safe processing
 *
 * @param data - Raw portfolio data
 * @returns Sanitized data safe for processing
 */
export function sanitizePortfolioData(
  data: UnvalidatedPortfolioData
): AssetCategory[] {
  if (!data || !Array.isArray(data)) return [];

  return data
    .filter(item => item && typeof item === "object")
    .map(item => ({
      id:
        item.id ||
        String(item.name || "unknown")
          .toLowerCase()
          .replace(/\s+/g, "-"),
      name: String(item.name || "Unknown"),
      totalValue: Math.max(0, Number(item.totalValue) || 0),
      change24h: Number(item.change24h) || 0,
      percentage: Number(item.percentage) || 0,
      color: item.color || "#6B7280",
      assets: Array.isArray(item.assets) ? item.assets : [],
    }))
    .filter(item => item.totalValue > 0); // Remove zero-value categories
}

// All functions and constants are already exported above with their declarations

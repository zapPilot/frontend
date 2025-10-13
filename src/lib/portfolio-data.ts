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

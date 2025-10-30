/**
 * Portfolio Data Processing Utilities
 *
 * Handles all portfolio data preparation, transformation, and state management.
 * Consolidates data processing logic from portfolio.utils.ts with clear
 * separation from mock data generation.
 *
 * @module lib/portfolio-data
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface PortfolioMetrics {
  totalValue: number;
  totalChange24h: number;
  totalChangePercentage: number;
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

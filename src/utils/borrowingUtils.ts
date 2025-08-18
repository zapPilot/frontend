import type { AssetCategory, PieChartData } from "../types/portfolio";

export interface PortfolioSeparation {
  assets: AssetCategory[];
  borrowing: AssetCategory[];
  totalAssets: number;
  totalBorrowing: number;
  netValue: number;
}

export interface BorrowingDisplayData {
  assetsPieData: PieChartData[];
  borrowingItems: AssetCategory[];
  netValue: number;
  totalBorrowing: number;
  hasBorrowing: boolean;
}

/**
 * Separate portfolio categories into assets (positive) and borrowing (negative)
 */
export function separateAssetsAndBorrowing(
  categories: AssetCategory[]
): PortfolioSeparation {
  const assets: AssetCategory[] = [];
  const borrowing: AssetCategory[] = [];
  let totalAssets = 0;
  let totalBorrowing = 0;

  categories.forEach(category => {
    if (category.totalValue >= 0) {
      assets.push(category);
      totalAssets += category.totalValue;
    } else {
      // Create a positive version for borrowing display
      const borrowingCategory: AssetCategory = {
        ...category,
        totalValue: Math.abs(category.totalValue), // Make positive for display
        percentage: Math.abs(category.percentage), // Make positive for display
      };
      borrowing.push(borrowingCategory);
      totalBorrowing += Math.abs(category.totalValue);
    }
  });

  // Recalculate percentages for assets based on total assets only
  if (totalAssets > 0) {
    assets.forEach(asset => {
      asset.percentage = (asset.totalValue / totalAssets) * 100;
    });
  }

  // Calculate percentages for borrowing based on total portfolio value
  const totalPortfolioValue = totalAssets + totalBorrowing;
  if (totalPortfolioValue > 0) {
    borrowing.forEach(debt => {
      debt.percentage = (debt.totalValue / totalPortfolioValue) * 100;
    });
  }

  return {
    assets,
    borrowing,
    totalAssets,
    totalBorrowing,
    netValue: totalAssets - totalBorrowing,
  };
}

/**
 * Calculate net portfolio value from separated data
 */
export function calculateNetValue(
  totalAssets: number,
  totalBorrowing: number
): number {
  return totalAssets - totalBorrowing;
}

/**
 * Transform portfolio data for display with borrowing context
 */
export function transformForDisplay(
  categories: AssetCategory[]
): BorrowingDisplayData {
  const separation = separateAssetsAndBorrowing(categories);

  // Create pie chart data from assets only
  const assetsPieData: PieChartData[] = separation.assets.map(asset => ({
    label: asset.name,
    value: asset.totalValue,
    percentage: asset.percentage,
    color: asset.color,
  }));

  return {
    assetsPieData,
    borrowingItems: separation.borrowing,
    netValue: separation.netValue,
    totalBorrowing: separation.totalBorrowing,
    hasBorrowing: separation.borrowing.length > 0,
  };
}

/**
 * Format borrowing amount for display
 */
export function formatBorrowingAmount(amount: number): string {
  return `-$${Math.abs(amount).toLocaleString()}`;
}

/**
 * Get borrowing percentage relative to total portfolio
 */
export function getBorrowingPercentage(
  borrowingAmount: number,
  totalPortfolioValue: number
): number {
  if (totalPortfolioValue <= 0) return 0;
  return (Math.abs(borrowingAmount) / totalPortfolioValue) * 100;
}

/**
 * Check if portfolio has significant borrowing (threshold-based)
 */
export function hasSignificantBorrowing(
  totalBorrowing: number,
  totalAssets: number
): boolean {
  const BORROWING_THRESHOLD = 0.01; // 1% threshold
  if (totalAssets <= 0) return false;
  return totalBorrowing / totalAssets > BORROWING_THRESHOLD;
}

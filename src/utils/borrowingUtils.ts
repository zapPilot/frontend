import type {
  AssetCategory,
  AssetDetail,
  PieChartData,
} from "../types/portfolio";

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

export interface PositionSeparationData {
  assetsForDisplay: AssetCategory[];
  borrowingPositions: AssetDetail[];
  totalAssets: number;
  totalBorrowing: number;
  netValue: number;
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

/**
 * Separate individual positions into assets and borrowing at the position level
 * This extracts negative AssetDetail positions as individual borrowing items
 */
export function separatePositionsAndBorrowing(
  categories: AssetCategory[]
): PositionSeparationData {
  const assetsForDisplay: AssetCategory[] = [];
  const borrowingPositions: AssetDetail[] = [];
  let totalAssets = 0;
  let totalBorrowing = 0;

  categories.forEach(category => {
    const assetPositions: AssetDetail[] = [];
    let categoryAssetValue = 0;

    // Process each asset position within the category
    category.assets.forEach(asset => {
      if (asset.value >= 0) {
        // Positive position - keep as asset
        assetPositions.push(asset);
        categoryAssetValue += asset.value;
        totalAssets += asset.value;
      } else {
        // Negative position - extract as borrowing
        const borrowingPosition: AssetDetail = {
          ...asset,
          value: Math.abs(asset.value), // Make positive for display
          amount: Math.abs(asset.amount), // Make positive for display
        };
        borrowingPositions.push(borrowingPosition);
        totalBorrowing += Math.abs(asset.value);
      }
    });

    // Only include category in assets if it has positive positions
    if (assetPositions.length > 0) {
      const assetCategory: AssetCategory = {
        ...category,
        assets: assetPositions,
        totalValue: categoryAssetValue,
        percentage: 0, // Will be recalculated below
      };
      assetsForDisplay.push(assetCategory);
    }
  });

  // Recalculate percentages for asset categories based on total assets only
  if (totalAssets > 0) {
    assetsForDisplay.forEach(category => {
      category.percentage = (category.totalValue / totalAssets) * 100;
    });
  }

  return {
    assetsForDisplay,
    borrowingPositions,
    totalAssets,
    totalBorrowing,
    netValue: totalAssets - totalBorrowing,
    hasBorrowing: borrowingPositions.length > 0,
  };
}

/**
 * Transform position-level data for display with borrowing context
 */
export function transformPositionsForDisplay(categories: AssetCategory[]): {
  assetsPieData: PieChartData[];
  assetsForDisplay: AssetCategory[];
  borrowingPositions: AssetDetail[];
  netValue: number;
  totalBorrowing: number;
  hasBorrowing: boolean;
} {
  const positionData = separatePositionsAndBorrowing(categories);

  // Create pie chart data from asset categories only
  const assetsPieData: PieChartData[] = positionData.assetsForDisplay.map(
    category => ({
      label: category.name,
      value: category.totalValue,
      percentage: category.percentage,
      color: category.color,
    })
  );

  return {
    assetsPieData,
    assetsForDisplay: positionData.assetsForDisplay,
    borrowingPositions: positionData.borrowingPositions,
    netValue: positionData.netValue,
    totalBorrowing: positionData.totalBorrowing,
    hasBorrowing: positionData.hasBorrowing,
  };
}

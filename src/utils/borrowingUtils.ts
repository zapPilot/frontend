import type {
  AssetCategory,
  AssetDetail,
  PieChartData,
} from "../types/portfolio";
import { logger } from "@/utils/logger";

const borrowingLogger = logger.createContextLogger("BorrowingUtils");

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
 * Updated to handle both legacy mixed structure and new separated structure
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
        assets: category.assets.map(asset => ({
          ...asset,
          value: Math.abs(asset.value), // Make positive for display
          amount: Math.abs(asset.amount), // Make positive for display
        })),
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

  // Calculate percentages for borrowing based on total borrowing value
  // This ensures borrowing percentages add up to 100% within borrowing context
  if (totalBorrowing > 0) {
    borrowing.forEach(debt => {
      debt.percentage = (debt.totalValue / totalBorrowing) * 100;
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
 * Validate pie chart weight calculations
 * Ensures percentages add up correctly and values are consistent
 */
export function validatePieChartWeights(
  pieData: PieChartData[],
  context = "Unknown"
): {
  isValid: boolean;
  totalPercentage: number;
  totalValue: number;
  issues: string[];
} {
  const issues: string[] = [];
  const totalPercentage = pieData.reduce(
    (sum, item) => sum + item.percentage,
    0
  );
  const totalValue = pieData.reduce((sum, item) => sum + item.value, 0);

  // Check percentage sum (should be close to 100%)
  if (Math.abs(totalPercentage - 100) > 0.1) {
    issues.push(
      `Percentages don't add up to 100% (${totalPercentage.toFixed(2)}%)`
    );
  }

  // Check for negative values
  pieData.forEach(item => {
    if (item.value < 0) {
      issues.push(`Negative value found: ${item.label} = ${item.value}`);
    }
    if (item.percentage < 0) {
      issues.push(
        `Negative percentage found: ${item.label} = ${item.percentage}%`
      );
    }
  });

  // Check for missing colors
  pieData.forEach(item => {
    if (!item.color) {
      issues.push(`Missing color for: ${item.label}`);
    }
  });

  const isValid = issues.length === 0;

  if (
    process.env.NODE_ENV === "development" &&
    (!isValid || context.includes("debug"))
  ) {
    borrowingLogger.debug(`Pie Chart Weight Validation [${context}]`, {
      isValid,
      totalPercentage: totalPercentage.toFixed(2) + "%",
      totalValue,
      issues: issues.length > 0 ? issues : undefined,
      pieData,
    });
  }

  return {
    isValid,
    totalPercentage,
    totalValue,
    issues,
  };
}

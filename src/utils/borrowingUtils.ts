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
 * Debug utility to log borrowing calculation details
 * Helps identify where weight calculations might be going wrong
 */
export function debugBorrowingCalculation(
  categories: AssetCategory[],
  context = "Unknown"
): void {
  if (process.env.NODE_ENV === "development") {
    const separation = separateAssetsAndBorrowing(categories);

    console.group(`🔍 Borrowing Debug [${context}]`);
    console.log("Input Categories:", categories.length);
    console.log("Total Assets:", separation.totalAssets);
    console.log("Total Borrowing:", separation.totalBorrowing);
    console.log("Net Value:", separation.netValue);
    console.log(
      "Asset Categories:",
      separation.assets.map(a => ({
        name: a.name,
        value: a.totalValue,
        percentage: a.percentage,
      }))
    );
    console.log(
      "Borrowing Categories:",
      separation.borrowing.map(b => ({
        name: b.name,
        value: b.totalValue,
        percentage: b.percentage,
      }))
    );
    console.groupEnd();
  }
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
    console.group(`⚖️ Pie Chart Weight Validation [${context}]`);
    console.log("Is Valid:", isValid);
    console.log("Total Percentage:", totalPercentage.toFixed(2) + "%");
    console.log("Total Value:", totalValue);
    if (issues.length > 0) {
      console.warn("Issues:", issues);
    }
    console.log("Data:", pieData);
    console.groupEnd();
  }

  return {
    isValid,
    totalPercentage,
    totalValue,
    issues,
  };
}

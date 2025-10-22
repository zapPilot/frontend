import {
  AssetCategory,
  CategoryShift,
  ChartDataPoint,
  ProcessedAssetCategory,
  RebalanceData,
} from "../types";
import { clamp, clampMin, ensureNonNegative } from "../../../lib/mathUtils";
import {
  ALLOCATION_THRESHOLDS,
  MOCK_VALUES,
  PERCENTAGE_BASE,
} from "@/constants/portfolio-allocation";

// Generate mock target allocation data for rebalancing demo
export const generateTargetAllocation = (
  currentCategories: ProcessedAssetCategory[]
): ProcessedAssetCategory[] => {
  return currentCategories.map(category => {
    // Generate realistic target percentages with some variation
    let targetPercentage = category.activeAllocationPercentage;

    // Apply some realistic rebalancing scenarios
    switch (category.id) {
      case "btc":
        // Slightly reduce BTC allocation
        targetPercentage = clampMin(
          category.activeAllocationPercentage - 5,
          ALLOCATION_THRESHOLDS.MIN_BTC_ALLOCATION
        );
        break;
      case "eth":
        // Increase ETH allocation
        targetPercentage = Math.min(
          ALLOCATION_THRESHOLDS.MAX_ETH_ALLOCATION,
          category.activeAllocationPercentage +
            ALLOCATION_THRESHOLDS.ETH_INCREASE
        );
        break;
      case "stablecoins":
        // Adjust stablecoins to balance
        targetPercentage =
          category.activeAllocationPercentage -
          ALLOCATION_THRESHOLDS.STABLECOIN_DECREASE;
        break;
      default:
        // Small random variation for other categories
        targetPercentage +=
          (Math.random() - 0.5) * ALLOCATION_THRESHOLDS.RANDOM_VARIATION;
    }

    // Ensure percentage is within valid range
    targetPercentage = clamp(targetPercentage, 0, PERCENTAGE_BASE);

    return {
      ...category,
      activeAllocationPercentage: targetPercentage,
      totalValue:
        (targetPercentage / PERCENTAGE_BASE) * MOCK_VALUES.PORTFOLIO_VALUE,
    };
  });
};

// Calculate shifts between current and target allocations
export const calculateCategoryShifts = (
  current: ProcessedAssetCategory[],
  target: ProcessedAssetCategory[]
): CategoryShift[] => {
  return current
    .map(currentCat => {
      const targetCat = target.find(t => t.id === currentCat.id);
      if (!targetCat) return null;

      const changeAmount =
        targetCat.activeAllocationPercentage -
        currentCat.activeAllocationPercentage;
      const changePercentage =
        currentCat.activeAllocationPercentage > 0
          ? (changeAmount / currentCat.activeAllocationPercentage) *
            PERCENTAGE_BASE
          : 0;

      let action: "increase" | "decrease" | "maintain";
      let actionDescription: string;

      if (Math.abs(changeAmount) < ALLOCATION_THRESHOLDS.CHANGE_MAINTAIN) {
        action = "maintain";
        actionDescription = "Maintain";
      } else if (changeAmount > 0) {
        action = "increase";
        actionDescription = "Buy more";
      } else {
        action = "decrease";
        actionDescription = "Sell";
      }

      return {
        categoryId: currentCat.id,
        categoryName: currentCat.name,
        currentPercentage: currentCat.activeAllocationPercentage,
        targetPercentage: targetCat.activeAllocationPercentage,
        changeAmount,
        changePercentage,
        action,
        actionDescription,
      };
    })
    .filter(Boolean) as CategoryShift[];
};

// Generate complete rebalance data
export const generateRebalanceData = (
  currentCategories: ProcessedAssetCategory[]
): RebalanceData => {
  const targetCategories = generateTargetAllocation(currentCategories);
  const shifts = calculateCategoryShifts(currentCategories, targetCategories);

  const totalRebalanceValue = shifts.reduce((sum, shift) => {
    return (
      sum + Math.abs(shift.changeAmount * MOCK_VALUES.DOLLAR_PER_PERCENTAGE)
    );
  }, 0);

  return {
    current: currentCategories,
    target: targetCategories,
    shifts,
    totalRebalanceValue,
  };
};

interface ProcessAssetCategoriesOptions {
  allocationOverrides?: Record<string, number>;
  totalPortfolioValue?: number;
}

const DEFAULT_TOTAL_VALUE = 100_000;

// Data processing utility
export const processAssetCategories = (
  assetCategories: AssetCategory[],
  excludedCategoryIds: string[],
  options: ProcessAssetCategoriesOptions = {}
): {
  processedCategories: ProcessedAssetCategory[];
  chartData: ChartDataPoint[];
} => {
  const {
    allocationOverrides = {},
    totalPortfolioValue = DEFAULT_TOTAL_VALUE,
  } = options;

  const categoriesWithBasePercentages = assetCategories.map(category => {
    const isExcluded = excludedCategoryIds.includes(category.id);
    const override = allocationOverrides[category.id];

    const targetPercentage =
      override !== undefined
        ? ensureNonNegative(override)
        : PERCENTAGE_BASE / clampMin(assetCategories.length, 1);

    // If overrides don't sum to 100, treat them as-is. The remainder will be shown as unallocated.
    const categoryValue =
      (targetPercentage / PERCENTAGE_BASE) * totalPortfolioValue;

    return {
      ...category,
      isExcluded,
      totalAllocationPercentage: targetPercentage,
      totalValue: categoryValue,
      activeAllocationPercentage: 0, // Will be calculated below
    };
  });

  const includedCategories = categoriesWithBasePercentages.filter(
    cat => !cat.isExcluded
  );
  const totalIncludedValue = includedCategories.reduce(
    (sum, cat) => sum + cat.totalValue,
    0
  );

  const processedCategories: ProcessedAssetCategory[] =
    categoriesWithBasePercentages.map(category => ({
      ...category,
      activeAllocationPercentage:
        category.isExcluded || totalIncludedValue === 0
          ? 0
          : (category.totalValue / totalIncludedValue) * PERCENTAGE_BASE,
    }));

  const chartData: ChartDataPoint[] = includedCategories.map(category => ({
    name: category.name,
    value:
      totalIncludedValue === 0
        ? 0
        : (category.totalValue / totalIncludedValue) * PERCENTAGE_BASE,
    id: category.id,
    color: category.color,
    isExcluded: false,
  }));

  return { processedCategories, chartData };
};

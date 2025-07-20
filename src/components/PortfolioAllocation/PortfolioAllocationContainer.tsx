"use client";

import { useMemo, useState } from "react";
import {
  ExcludedCategoriesProvider,
  useExcludedCategories,
} from "./ExcludedCategoriesContext";
import {
  EnhancedOverview,
  AllocationBuilder,
  DashboardCards,
} from "./components";
import {
  AssetCategory,
  ProcessedAssetCategory,
  ChartDataPoint,
  PortfolioAllocationContainerProps,
  RebalanceData,
  CategoryShift,
} from "./types";

// Generate mock target allocation data for rebalancing demo
const generateTargetAllocation = (
  currentCategories: ProcessedAssetCategory[]
): ProcessedAssetCategory[] => {
  return currentCategories.map(category => {
    // Generate realistic target percentages with some variation
    let targetPercentage = category.activeAllocationPercentage;

    // Apply some realistic rebalancing scenarios
    switch (category.id) {
      case "btc":
        // Slightly reduce BTC allocation
        targetPercentage = Math.max(
          25,
          category.activeAllocationPercentage - 5
        );
        break;
      case "eth":
        // Increase ETH allocation
        targetPercentage = Math.min(
          50,
          category.activeAllocationPercentage + 7
        );
        break;
      case "stablecoins":
        // Adjust stablecoins to balance
        targetPercentage = category.activeAllocationPercentage - 2;
        break;
      default:
        // Small random variation for other categories
        targetPercentage += (Math.random() - 0.5) * 10;
    }

    // Ensure percentage is within valid range
    targetPercentage = Math.max(0, Math.min(100, targetPercentage));

    return {
      ...category,
      activeAllocationPercentage: targetPercentage,
      totalValue: (targetPercentage / 100) * 30000, // Mock total portfolio value
    };
  });
};

// Calculate shifts between current and target allocations
const calculateCategoryShifts = (
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
          ? (changeAmount / currentCat.activeAllocationPercentage) * 100
          : 0;

      let action: "increase" | "decrease" | "maintain";
      let actionDescription: string;

      if (Math.abs(changeAmount) < 0.5) {
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
const generateRebalanceData = (
  currentCategories: ProcessedAssetCategory[]
): RebalanceData => {
  const targetCategories = generateTargetAllocation(currentCategories);
  const shifts = calculateCategoryShifts(currentCategories, targetCategories);

  const totalRebalanceValue = shifts.reduce((sum, shift) => {
    return sum + Math.abs(shift.changeAmount * 300); // Mock dollar value per percentage point
  }, 0);

  return {
    current: currentCategories,
    target: targetCategories,
    shifts,
    totalRebalanceValue,
  };
};

// Data processing utility
const processAssetCategories = (
  assetCategories: AssetCategory[],
  excludedCategoryIds: string[]
): {
  processedCategories: ProcessedAssetCategory[];
  chartData: ChartDataPoint[];
} => {
  // Calculate total portfolio value
  const totalPortfolioValue = assetCategories.reduce(sum => {
    // Mock calculation - in real app this would use actual portfolio values
    return sum + 10000; // Placeholder value per category
  }, 0);

  // Calculate base percentages
  const categoriesWithBasePercentages = assetCategories.map(category => {
    const isExcluded = excludedCategoryIds.includes(category.id);
    const mockValue = 10000; // Placeholder - use real values in production
    const totalAllocationPercentage = (mockValue / totalPortfolioValue) * 100;

    return {
      ...category,
      isExcluded,
      totalAllocationPercentage,
      totalValue: mockValue,
      activeAllocationPercentage: 0, // Will be calculated below
    };
  });

  // Calculate active percentages (only among included categories)
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
      activeAllocationPercentage: category.isExcluded
        ? 0
        : (category.totalValue / totalIncludedValue) * 100,
    }));

  // Generate chart data (only for included categories)
  const chartData: ChartDataPoint[] = includedCategories.map(category => ({
    name: category.name,
    value: (category.totalValue / totalIncludedValue) * 100,
    id: category.id,
    color: category.color,
    isExcluded: false,
  }));

  return { processedCategories, chartData };
};

// Inner component that consumes the context
const PortfolioAllocationContent: React.FC<{
  assetCategories: AssetCategory[];
  variationType: string;
  onZapAction?: (includedCategories: ProcessedAssetCategory[]) => void;
}> = ({ assetCategories, variationType, onZapAction }) => {
  const { excludedCategoryIds } = useExcludedCategories();
  const [isRebalanceMode, setIsRebalanceMode] = useState(false);

  const { processedCategories, chartData } = useMemo(() => {
    return processAssetCategories(assetCategories, excludedCategoryIds);
  }, [assetCategories, excludedCategoryIds]);

  const rebalanceData = useMemo(() => {
    if (!isRebalanceMode) return undefined;
    return generateRebalanceData(processedCategories);
  }, [isRebalanceMode, processedCategories]);

  // Remove unused variable warning - includedCategories not needed here
  // const includedCategories = processedCategories.filter(cat => !cat.isExcluded);

  // Render the appropriate variation
  const renderVariation = () => {
    const rebalanceMode = {
      isEnabled: isRebalanceMode,
      data: rebalanceData,
    };

    switch (variationType) {
      case "enhancedOverview":
        return (
          <EnhancedOverview
            processedCategories={processedCategories}
            chartData={chartData}
            rebalanceMode={rebalanceMode}
            onZapAction={onZapAction}
          />
        );
      case "allocationBuilder":
        return (
          <AllocationBuilder
            processedCategories={processedCategories}
            rebalanceMode={rebalanceMode}
            onZapAction={onZapAction}
          />
        );
      case "dashboardCards":
        return (
          <DashboardCards
            processedCategories={processedCategories}
            rebalanceMode={rebalanceMode}
            onZapAction={onZapAction}
          />
        );
      default:
        return (
          <EnhancedOverview
            processedCategories={processedCategories}
            chartData={chartData}
            rebalanceMode={rebalanceMode}
            onZapAction={onZapAction}
          />
        );
    }
  };

  return (
    <div data-testid="portfolio-allocation-container" className="space-y-4">
      {/* Rebalance Mode Toggle */}
      <div className="bg-gray-900/30 rounded-2xl border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-white">Rebalance Mode</h4>
            <p className="text-xs text-gray-400 mt-1">
              Compare current vs. target allocations
            </p>
          </div>
          <button
            onClick={() => setIsRebalanceMode(!isRebalanceMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isRebalanceMode ? "bg-purple-500" : "bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isRebalanceMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {isRebalanceMode && rebalanceData && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Total Rebalance Value:</span>
              <span className="text-white font-medium">
                ${rebalanceData.totalRebalanceValue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-gray-400">Active Changes:</span>
              <span className="text-white font-medium">
                {
                  rebalanceData.shifts.filter(s => s.action !== "maintain")
                    .length
                }{" "}
                categories
              </span>
            </div>
          </div>
        )}
      </div>

      {renderVariation()}
    </div>
  );
};

// Main container component with provider
export const PortfolioAllocationContainer: React.FC<
  PortfolioAllocationContainerProps
> = ({ variationType = "enhancedOverview", assetCategories, onZapAction }) => {
  return (
    <ExcludedCategoriesProvider>
      <PortfolioAllocationContent
        assetCategories={assetCategories}
        variationType={variationType}
        onZapAction={onZapAction}
      />
    </ExcludedCategoriesProvider>
  );
};

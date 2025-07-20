"use client";

import { useMemo, useState } from "react";
import {
  ExcludedCategoriesProvider,
  useExcludedCategories,
} from "./ExcludedCategoriesContext";
import { EnhancedOverview, SwapControls } from "./components";
import {
  AssetCategory,
  CategoryShift,
  ChartDataPoint,
  OperationMode,
  PortfolioAllocationContainerProps,
  PortfolioSwapAction,
  ProcessedAssetCategory,
  RebalanceData,
  SwapSettings,
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
  operationMode?: OperationMode;
  isRebalanceMode?: boolean;
  onZapAction?: (action: PortfolioSwapAction) => void;
}> = ({
  assetCategories,
  operationMode = "zapIn",
  isRebalanceMode = false,
  onZapAction,
}) => {
  const { excludedCategoryIds } = useExcludedCategories();
  const [swapSettings, setSwapSettings] = useState<SwapSettings>({
    amount: "",
    slippageTolerance: 0.5, // Default 0.5%
  });

  const { processedCategories, chartData } = useMemo(() => {
    return processAssetCategories(assetCategories, excludedCategoryIds);
  }, [assetCategories, excludedCategoryIds]);

  const rebalanceData = useMemo(() => {
    if (!isRebalanceMode) return undefined;
    return generateRebalanceData(processedCategories);
  }, [isRebalanceMode, processedCategories]);

  // Enhanced zap action handler
  const handleEnhancedZapAction = () => {
    const includedCategories = processedCategories.filter(
      cat => !cat.isExcluded
    );

    const portfolioSwapAction: PortfolioSwapAction = {
      operationMode,
      includedCategories,
      swapSettings,
      ...(isRebalanceMode && rebalanceData ? { rebalanceData } : {}),
    };

    onZapAction?.(portfolioSwapAction);
  };

  // Remove unused variable warning - includedCategories not needed here
  // const includedCategories = processedCategories.filter(cat => !cat.isExcluded);

  // Render the appropriate variation
  const renderVariation = () => {
    const rebalanceMode = {
      isEnabled: isRebalanceMode,
      ...(rebalanceData ? { data: rebalanceData } : {}),
    };

    const includedCategories = processedCategories.filter(
      cat => !cat.isExcluded
    );

    // Common SwapControls props
    const swapControlsProps = {
      operationMode,
      swapSettings,
      onSwapSettingsChange: setSwapSettings,
      includedCategories,
    };
    return (
      <EnhancedOverview
        processedCategories={processedCategories}
        chartData={chartData}
        rebalanceMode={rebalanceMode}
        onZapAction={handleEnhancedZapAction}
        swapControls={<SwapControls {...swapControlsProps} />}
        operationMode={operationMode}
      />
    );
  };

  return (
    <div data-testid="portfolio-allocation-container" className="space-y-4">
      {renderVariation()}
    </div>
  );
};

// Main container component with provider
export const PortfolioAllocationContainer: React.FC<
  PortfolioAllocationContainerProps
> = ({
  assetCategories,
  operationMode = "zapIn",
  isRebalanceMode = false,
  onZapAction,
}) => {
  return (
    <ExcludedCategoriesProvider>
      <PortfolioAllocationContent
        assetCategories={assetCategories}
        operationMode={operationMode}
        isRebalanceMode={isRebalanceMode}
        {...(onZapAction ? { onZapAction } : {})}
      />
    </ExcludedCategoriesProvider>
  );
};

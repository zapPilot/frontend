"use client";

import { useMemo } from "react";
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
} from "./types";

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

  const { processedCategories, chartData } = useMemo(() => {
    return processAssetCategories(assetCategories, excludedCategoryIds);
  }, [assetCategories, excludedCategoryIds]);

  // Remove unused variable warning - includedCategories not needed here
  // const includedCategories = processedCategories.filter(cat => !cat.isExcluded);

  // Render the appropriate variation
  const renderVariation = () => {
    switch (variationType) {
      case "enhancedOverview":
        return (
          <EnhancedOverview
            processedCategories={processedCategories}
            chartData={chartData}
            onZapAction={onZapAction}
          />
        );
      case "allocationBuilder":
        return (
          <AllocationBuilder
            processedCategories={processedCategories}
            onZapAction={onZapAction}
          />
        );
      case "dashboardCards":
        return (
          <DashboardCards
            processedCategories={processedCategories}
            onZapAction={onZapAction}
          />
        );
      default:
        return (
          <EnhancedOverview
            processedCategories={processedCategories}
            chartData={chartData}
            onZapAction={onZapAction}
          />
        );
    }
  };

  return (
    <div data-testid="portfolio-allocation-container">{renderVariation()}</div>
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

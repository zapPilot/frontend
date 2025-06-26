import { useState, useMemo } from "react";
import {
  AssetCategory,
  PieChartData,
  PortfolioMetrics,
} from "../types/portfolio";
import { calculatePortfolioMetrics } from "../lib/utils";
import { strategyPortfolios } from "../data/mockStrategyPortfolios";

/**
 * Custom hook for strategy portfolio state management and calculations
 */
export function useStrategyPortfolio(strategyId: string) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Get portfolio data for the specific strategy
  const portfolioData: AssetCategory[] = useMemo(
    () => strategyPortfolios[strategyId] || [],
    [strategyId]
  );

  // Calculate portfolio metrics
  const portfolioMetrics: PortfolioMetrics = useMemo(
    () => calculatePortfolioMetrics(portfolioData),
    [portfolioData]
  );

  // Transform data for pie chart
  const pieChartData: PieChartData[] = useMemo(
    () =>
      portfolioData.map(cat => ({
        label: cat.name,
        value: cat.totalValue,
        percentage: cat.percentage,
        color: cat.color,
      })),
    [portfolioData]
  );

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleLegendItemClick = (item: PieChartData) => {
    const category = portfolioData.find(cat => cat.name === item.label);
    if (category) {
      toggleCategoryExpansion(category.id);
    }
  };

  return {
    portfolioData,
    expandedCategory,
    portfolioMetrics,
    pieChartData,
    toggleCategoryExpansion,
    handleLegendItemClick,
  };
}

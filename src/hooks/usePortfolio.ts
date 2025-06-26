import { useState, useMemo } from "react";
import {
  AssetCategory,
  PieChartData,
  PortfolioMetrics,
} from "../types/portfolio";
import { calculatePortfolioMetrics } from "../lib/utils";

/**
 * Custom hook for portfolio state management and calculations
 */
export function usePortfolio(portfolioData: AssetCategory[]) {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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

  const toggleBalanceVisibility = () => {
    setBalanceHidden(!balanceHidden);
  };

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
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    pieChartData,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
    handleLegendItemClick,
  };
}

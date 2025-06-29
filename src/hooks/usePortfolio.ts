import { useState, useMemo, useCallback } from "react";
import {
  AssetCategory,
  PieChartData,
  PortfolioMetrics,
} from "../types/portfolio";
import { calculatePortfolioMetrics } from "../lib/utils";

/**
 * Custom hook for portfolio state management and calculations
 * Optimized with memoization for performance
 */
export function usePortfolio(portfolioData: AssetCategory[]) {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Calculate portfolio metrics - memoized for performance
  const portfolioMetrics: PortfolioMetrics = useMemo(
    () => calculatePortfolioMetrics(portfolioData),
    [portfolioData]
  );

  // Transform data for pie chart - memoized to prevent unnecessary re-renders
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

  // Optimized callback functions to prevent unnecessary re-renders
  const toggleBalanceVisibility = useCallback(() => {
    setBalanceHidden(prev => !prev);
  }, []);

  const toggleCategoryExpansion = useCallback((categoryId: string) => {
    setExpandedCategory(prev => (prev === categoryId ? null : categoryId));
  }, []);

  const handleLegendItemClick = useCallback(
    (item: PieChartData) => {
      const category = portfolioData.find(cat => cat.name === item.label);
      if (category) {
        toggleCategoryExpansion(category.id);
      }
    },
    [portfolioData, toggleCategoryExpansion]
  );

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

import { useState, useMemo } from "react";
import { AssetCategory, PortfolioMetrics } from "../types/portfolio";
import { calculatePortfolioMetrics } from "../lib/portfolio-data";
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

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return {
    portfolioData,
    expandedCategory,
    portfolioMetrics,
    toggleCategoryExpansion,
  };
}

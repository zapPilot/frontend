import { useState, useMemo } from "react";
import { AssetCategory, PortfolioMetrics } from "../types/portfolio";
import { calculatePortfolioMetrics } from "../lib/portfolio-data";

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

  const toggleBalanceVisibility = () => {
    setBalanceHidden(!balanceHidden);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return {
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
  };
}

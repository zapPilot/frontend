import { useMemo } from "react";
import { usePortfolioViewToggles } from "@/hooks/useWalletPortfolioState";
import { calculatePortfolioMetrics } from "@/lib/portfolio-data";
import type { AssetCategory, PortfolioMetrics } from "@/types/portfolio";

/**
 * Legacy portfolio hook kept for compatibility.
 * Delegates view toggles to the shared portfolio view toggle hook
 * so that there is a single source of truth.
 */
export function usePortfolio(portfolioData: AssetCategory[]) {
  const toggles = usePortfolioViewToggles();

  const portfolioMetrics: PortfolioMetrics = useMemo(
    () => calculatePortfolioMetrics(portfolioData),
    [portfolioData]
  );

  return {
    ...toggles,
    portfolioMetrics,
  };
}

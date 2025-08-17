import { useUser } from "../contexts/UserContext";
import type { AssetCategory, PieChartData } from "../types/portfolio";
import { usePortfolioData as usePortfolioDataQuery } from "./queries/usePortfolioQuery";

export interface UsePortfolioDataReturn {
  totalValue: number | null;
  categories: AssetCategory[] | null;
  pieChartData: PieChartData[] | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  isRetrying: boolean;
  isConnected: boolean;
}

/**
 * Custom hook for fetching and transforming portfolio data from API
 */
export function usePortfolioData(): UsePortfolioDataReturn {
  const { userInfo, error: userError, isConnected } = useUser();

  // Use React Query hook for portfolio data
  const portfolioQuery = usePortfolioDataQuery(userInfo?.userId);

  // Handle USER_NOT_FOUND scenarios
  if (userError === "USER_NOT_FOUND") {
    return {
      totalValue: null,
      categories: null,
      pieChartData: null,
      isLoading: false,
      error: userError,
      retry: () => {}, // No-op for USER_NOT_FOUND
      isRetrying: false,
      isConnected,
    };
  }

  return {
    totalValue: portfolioQuery.totalValue,
    categories: portfolioQuery.categories,
    pieChartData: portfolioQuery.pieChartData,
    isLoading: portfolioQuery.isLoading,
    error: portfolioQuery.error,
    retry: portfolioQuery.refetch,
    isRetrying: portfolioQuery.isRefetching,
    isConnected,
  };
}

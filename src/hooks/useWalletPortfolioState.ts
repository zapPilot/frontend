import { usePortfolio } from "./usePortfolio";
import { usePortfolioDisplayData } from "./queries/usePortfolioQuery";
import { useWalletModal } from "./useWalletModal";
import { preparePortfolioDataWithBorrowing } from "../utils/portfolioTransformers";
import { useUser } from "../contexts/UserContext";

/**
 * Custom hook that consolidates all wallet portfolio state and data transformations
 * Reduces duplication between WalletPortfolio and WalletPortfolioRefactored components
 */
export function useWalletPortfolioState() {
  const { userInfo, isConnected } = useUser();

  // Data fetching and API state
  const {
    totalValue,
    categories: apiCategoriesData,
    isLoading,
    error: apiError,
    refetch: retry,
    isRefetching: isRetrying,
  } = usePortfolioDisplayData(userInfo?.userId);

  // Portfolio UI state management
  const {
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
  } = usePortfolio(apiCategoriesData || []);

  // Wallet modal state
  const {
    isOpen: isWalletManagerOpen,
    openModal: openWalletManager,
    closeModal: closeWalletManager,
  } = useWalletModal();

  // Consolidated data preparation - use borrowing-aware transformation to ensure pie chart only shows assets
  const { portfolioData, pieChartData } = preparePortfolioDataWithBorrowing(
    apiCategoriesData,
    totalValue,
    "useWalletPortfolioState"
  );

  return {
    // API data and loading states
    totalValue,
    portfolioData,
    pieChartData,
    isLoading,
    apiError,
    retry,
    isRetrying,
    isConnected,

    // Portfolio UI state
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    toggleBalanceVisibility,
    toggleCategoryExpansion,

    // Wallet modal state
    isWalletManagerOpen,
    openWalletManager,
    closeWalletManager,
  };
}

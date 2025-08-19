import { usePortfolio } from "./usePortfolio";
import { usePortfolioData } from "./usePortfolioData";
import { useWalletModal } from "./useWalletModal";
import { preparePortfolioDataWithBorrowing } from "../utils/portfolioTransformers";

/**
 * Custom hook that consolidates all wallet portfolio state and data transformations
 * Reduces duplication between WalletPortfolio and WalletPortfolioRefactored components
 */
export function useWalletPortfolioState() {
  // Data fetching and API state
  const {
    totalValue,
    categories: apiCategoriesData,
    isLoading,
    error: apiError,
    retry,
    isRetrying,
    isConnected,
  } = usePortfolioData();

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

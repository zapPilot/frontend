import { usePortfolio } from "./usePortfolio";
import { usePortfolioData } from "./usePortfolioData";
import { useWalletModal } from "./useWalletModal";
import { preparePortfolioData } from "../utils/portfolioTransformers";

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

  // Consolidated data preparation - all transformation logic in utils layer
  const { portfolioData, pieChartData } = preparePortfolioData(
    apiCategoriesData,
    totalValue
  );

  return {
    // API data and loading states
    totalValue,
    portfolioData,
    pieChartData,
    isLoading,
    apiError,

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

import { useTokenData } from "./useTokenData";
import { useTokenActions } from "./useTokenActions";
import { useTokenFilters } from "./useTokenFilters";
import { DustToken } from "../../../types/optimize";

interface UseTokenManagementReturn {
  // Data state
  tokens: DustToken[];
  filteredTokens: DustToken[];
  isLoading: boolean;
  error: string | null;

  // Actions state
  deletedIds: Set<string>;

  // Filter metrics
  activeTokensCount: number;
  deletedTokensCount: number;

  // Data actions
  fetchTokens: (chainName: string, userAddress: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;

  // Token actions
  deleteToken: (tokenId: string) => void;
  restoreTokens: () => void;
}

interface ToastConfig {
  type: string;
  title: string;
  message: string;
  duration?: number;
}

/**
 * Simplified token management hook that combines focused hooks
 * Replaces the over-engineered 150+ line useTokenState hook
 *
 * This approach:
 * - Separates concerns into focused hooks
 * - Reduces complexity and improves maintainability
 * - Makes testing easier with smaller, focused units
 * - Removes over-abstracted cancellation system
 * - Uses native AbortController directly
 */
export function useTokenManagement(
  showToast?: (toast: ToastConfig) => void
): UseTokenManagementReturn {
  // Data management
  const { tokens, isLoading, error, fetchTokens, clearError, reset } =
    useTokenData(showToast);

  // Action management
  const { deletedIds, deleteToken, restoreTokens } = useTokenActions();

  // Filtering and metrics
  const { filteredTokens, activeTokensCount, deletedTokensCount } =
    useTokenFilters({ tokens, deletedIds });

  return {
    // Data state
    tokens,
    filteredTokens,
    isLoading,
    error,

    // Actions state
    deletedIds,

    // Filter metrics
    activeTokensCount,
    deletedTokensCount,

    // Data actions
    fetchTokens,
    clearError,
    reset,

    // Token actions
    deleteToken,
    restoreTokens,
  };
}

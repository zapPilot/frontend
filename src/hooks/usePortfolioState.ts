import { useMemo } from "react";

import type { LandingPageResponse } from "../services/analyticsService";
import type { AssetCategory } from "../types/portfolio";
import { PortfolioState, PortfolioStateType } from "../types/portfolioState";

/**
 * Centralized portfolio state management hook
 *
 * Provides consistent state interpretation across all portfolio components
 * to eliminate inconsistent UI states for the same data conditions.
 */
export function usePortfolioState({
  isConnected,
  isLoading,
  isRetrying = false,
  error,
  landingPageData,
  hasZeroData,
}: {
  isConnected: boolean;
  isLoading: boolean;
  isRetrying?: boolean;
  error?: string | null;
  landingPageData?: LandingPageResponse | null;
  hasZeroData: boolean;
}): PortfolioState {
  return useMemo(() => {
    // Determine the portfolio state type based on conditions
    const getPortfolioStateType = (): PortfolioStateType => {
      // 1. API Error
      if (error) {
        return "error";
      }

      // 2. Loading state (including retrying)
      if (isLoading || isRetrying) {
        return "loading";
      }

      // 3. Has data - show regardless of connection status (enables visitor mode)
      if (landingPageData && !hasZeroData) {
        return "has_data";
      }

      // 4. Connected but no data (API returns zeros)
      if (isConnected && hasZeroData) {
        return "connected_no_data";
      }

      // 5. Not connected AND no valid data - only now show connect prompt
      if (!isConnected) {
        return "wallet_disconnected";
      }

      // 6. Connected but still loading (no data yet, no error)
      if (isConnected && !landingPageData && !error) {
        return "loading";
      }

      // Default fallback - shouldn't reach here in normal flow
      return "loading";
    };

    const stateType = getPortfolioStateType();

    // Extract total value, handling zero properly (don't convert 0 to null)
    const totalValue = landingPageData?.total_net_usd ?? null;

    return {
      type: stateType,
      isConnected,
      isLoading: isLoading || isRetrying,
      hasError: Boolean(error),
      hasZeroData,
      totalValue,
      errorMessage: error || null,
      isRetrying,
    };
  }, [isConnected, isLoading, isRetrying, error, landingPageData, hasZeroData]);
}

/**
 * Helper hooks for specific state checks
 */
export function usePortfolioStateHelpers(portfolioState: PortfolioState) {
  return useMemo(
    () => ({
      // Should show loading indicators
      shouldShowLoading: portfolioState.type === "loading",

      // Should show "Connect Wallet" prompts
      shouldShowConnectPrompt: portfolioState.type === "wallet_disconnected",

      // Should show "no data, wait 24h" message
      shouldShowNoDataMessage: portfolioState.type === "connected_no_data",

      // Should show normal portfolio content
      shouldShowPortfolioContent: portfolioState.type === "has_data",

      // Should show error messages
      shouldShowError: portfolioState.type === "error",

      // Get display value for total (handles zero vs null properly)
      getDisplayTotalValue: () => {
        if (portfolioState.type === "wallet_disconnected") return null;
        if (portfolioState.type === "loading") return null;
        if (portfolioState.type === "error") return null;
        if (portfolioState.type === "connected_no_data") return 0;
        return portfolioState.totalValue;
      },
    }),
    [portfolioState]
  );
}

/**
 * Portfolio state management utilities
 *
 * Consolidates common state reset and validation patterns used throughout
 * the application for consistent portfolio state handling.
 */
export const portfolioStateUtils = {
  /**
   * Reset portfolio state to initial/error state
   *
   * Common pattern for error handling and initialization.
   * Returns a clean state object with null values.
   */
  resetState: () => ({
    totalValue: null as number | null,
    categories: null as AssetCategory[] | null,
  }),

  /**
   * Check if portfolio data is in a loading/empty state
   *
   * Useful for determining when to show loading indicators or empty states.
   */
  isEmpty: (categories: AssetCategory[] | null, totalValue: number | null) => {
    return !categories || categories.length === 0 || !totalValue;
  },

  /**
   * Check if portfolio data is valid and ready for display
   */
  isValid: (categories: AssetCategory[] | null, totalValue: number | null) => {
    return (
      Boolean(categories && categories.length > 0) &&
      totalValue !== null &&
      totalValue > 0
    );
  },

  /**
   * Safe array length check - prevents redundant .length === 0 patterns
   */
  hasItems: <T>(array: T[] | null | undefined): array is T[] => {
    return Array.isArray(array) && array.length > 0;
  },

  /**
   * Safe empty array check - consolidated null/undefined/empty checking
   */
  isEmptyArray: <T>(array: T[] | null | undefined): boolean => {
    return !Array.isArray(array) || array.length === 0;
  },
} as const;

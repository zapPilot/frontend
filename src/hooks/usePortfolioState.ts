import { useMemo } from "react";
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
  landingPageData?: unknown;
  hasZeroData: boolean;
}): PortfolioState {
  return useMemo(() => {
    // Determine the portfolio state type based on conditions
    const getPortfolioStateType = (): PortfolioStateType => {
      // 1. Wallet not connected
      if (!isConnected) {
        return "wallet_disconnected";
      }

      // 2. API Error
      if (error) {
        return "error";
      }

      // 3. Loading state (including retrying)
      if (isLoading || isRetrying) {
        return "loading";
      }

      // 4. Connected but no data (API returns zeros)
      if (isConnected && hasZeroData) {
        return "connected_no_data";
      }

      // 5. Has data (normal portfolio state)
      if (isConnected && landingPageData) {
        return "has_data";
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
    const totalValue = (landingPageData as any)?.total_net_usd ?? null;

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

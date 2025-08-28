import { useMemo } from "react";
import {
  DustToken,
  OptimizationOptions,
  OptimizationData,
} from "../../../types/optimize";

interface UseOptimizationDataProps {
  filteredTokens: DustToken[];
  optimizationOptions: OptimizationOptions;
  isWalletConnected: boolean;
  isLoading?: boolean;
}

export function useOptimizationData({
  filteredTokens,
  optimizationOptions,
  isWalletConnected,
  isLoading = false,
}: UseOptimizationDataProps): OptimizationData {
  return useMemo(() => {
    // Calculate dust token metrics
    const dustValue = filteredTokens.reduce(
      (sum, token) => sum + token.amount * token.price,
      0
    );
    const dustTokenCount = filteredTokens.length;

    // Count selected optimization options
    const selectedCount =
      (optimizationOptions.convertDust ? 1 : 0) +
      (optimizationOptions.rebalancePortfolio ? 1 : 0);

    // Calculate optimization readiness
    const hasValidTokens = dustTokenCount > 0;
    const canOptimize =
      selectedCount > 0 &&
      isWalletConnected &&
      !isLoading &&
      (optimizationOptions.convertDust ? hasValidTokens : true);

    // Mock optimization data - in real app this would come from API
    // These could be calculated based on actual portfolio analysis
    const rebalanceActions = Math.min(dustTokenCount, 3); // Estimate based on token count
    const chainCount = Math.min(Math.ceil(dustTokenCount / 5), 2); // Rough chain distribution
    const totalSavings = dustValue * 0.15; // 15% estimated savings
    const estimatedGasSavings = Math.min(dustValue * 0.002, 0.01); // Gas savings estimate

    return {
      // Dust token calculations
      dustValue,
      dustTokenCount,

      // Optimization metrics
      rebalanceActions,
      chainCount,
      totalSavings,
      estimatedGasSavings,

      // UI helpers
      selectedCount,
      hasValidTokens,
      canOptimize,
    };
  }, [
    filteredTokens,
    optimizationOptions.convertDust,
    optimizationOptions.rebalancePortfolio,
    isWalletConnected,
    isLoading,
  ]);
}

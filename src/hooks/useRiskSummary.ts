/**
 * Custom hook for fetching risk summary data
 *
 * Encapsulates risk assessment data fetching logic with proper
 * loading, error states, and cleanup handling.
 */

import { useState, useEffect, useCallback } from "react";
import { getRiskSummary } from "../services/analyticsService";
import { ActualRiskSummaryResponse } from "../types/risk";

interface UseRiskSummaryResult {
  data: ActualRiskSummaryResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for fetching and managing risk summary data
 *
 * @param userId - The user ID to fetch risk data for
 * @returns Object containing data, loading state, error, and refetch function
 */
/**
 * Validates that the API response matches our expected structure
 */
function validateResponse(
  response: unknown
): response is ActualRiskSummaryResponse {
  if (!response || typeof response !== "object") {
    return false;
  }

  const obj = response as Record<string, unknown>;

  // Check required fields
  if (typeof obj["user_id"] !== "string") {
    return false;
  }

  // Check risk_summary object
  if (!obj["risk_summary"] || typeof obj["risk_summary"] !== "object") {
    return false;
  }

  const riskSummary = obj["risk_summary"] as Record<string, unknown>;

  // Validate volatility data structure
  if (
    !riskSummary["volatility"] ||
    typeof riskSummary["volatility"] !== "object"
  ) {
    return false;
  }

  const volatility = riskSummary["volatility"] as Record<string, unknown>;
  if (
    typeof volatility["volatility_daily"] !== "number" ||
    typeof volatility["volatility_annualized"] !== "number" ||
    typeof volatility["period_days"] !== "number"
  ) {
    return false;
  }

  // Validate drawdown data structure
  if (!riskSummary["drawdown"] || typeof riskSummary["drawdown"] !== "object") {
    return false;
  }

  const drawdown = riskSummary["drawdown"] as Record<string, unknown>;
  if (
    typeof drawdown["max_drawdown_percentage"] !== "number" ||
    typeof drawdown["period_days"] !== "number" ||
    typeof drawdown["recovery_needed_percentage"] !== "number"
  ) {
    return false;
  }

  // Validate optional sharpe_ratio data structure
  if (riskSummary["sharpe_ratio"]) {
    const sharpeRatio = riskSummary["sharpe_ratio"] as Record<string, unknown>;
    if (
      typeof sharpeRatio["sharpe_ratio"] !== "number" ||
      typeof sharpeRatio["portfolio_return_annual"] !== "number" ||
      typeof sharpeRatio["risk_free_rate_annual"] !== "number" ||
      typeof sharpeRatio["excess_return"] !== "number" ||
      typeof sharpeRatio["volatility_annual"] !== "number" ||
      typeof sharpeRatio["interpretation"] !== "string" ||
      typeof sharpeRatio["period_days"] !== "number" ||
      typeof sharpeRatio["data_points"] !== "number"
    ) {
      return false;
    }
  }

  // Check summary_metrics object
  if (!obj["summary_metrics"] || typeof obj["summary_metrics"] !== "object") {
    return false;
  }

  const summaryMetrics = obj["summary_metrics"] as Record<string, unknown>;

  // Validate summary metrics
  if (
    typeof summaryMetrics["annualized_volatility_percentage"] !== "number" ||
    typeof summaryMetrics["max_drawdown_percentage"] !== "number"
  ) {
    return false;
  }

  // Validate optional sharpe_ratio in summary metrics
  if (
    summaryMetrics["sharpe_ratio"] !== undefined &&
    typeof summaryMetrics["sharpe_ratio"] !== "number"
  ) {
    return false;
  }

  return true;
}

export function useRiskSummary(userId: string): UseRiskSummaryResult {
  const [data, setData] = useState<ActualRiskSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRiskSummary = useCallback(
    async (signal?: AbortSignal) => {
      if (!userId) {
        setData(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await getRiskSummary(userId);

        // Validate the response structure
        if (!validateResponse(response)) {
          throw new Error(
            "Invalid API response: The risk data format is not as expected"
          );
        }

        // Only update state if request wasn't aborted
        if (!signal?.aborted) {
          setData(response);
        }
      } catch (err) {
        // Only update error state if request wasn't aborted
        if (!signal?.aborted) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error occurred";
          setError(new Error(`Failed to fetch risk summary: ${errorMessage}`));
          setData(null);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchRiskSummary(controller.signal);

    // Return cleanup function
    return () => {
      controller.abort();
    };
  }, [fetchRiskSummary]);

  const refetch = () => {
    fetchRiskSummary();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Custom hook for fetching risk summary data
 *
 * Encapsulates risk assessment data fetching logic with proper
 * loading, error states, and cleanup handling.
 */

import { useCallback, useEffect, useState } from "react";

import { ActualRiskSummaryResponse } from '@/types/domain/risk';

import { getRiskSummary } from "../services/analyticsService";

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
    (typeof volatility["volatility_daily"] !== "number" &&
      volatility["volatility_daily"] !== null) ||
    (typeof volatility["volatility_annualized"] !== "number" &&
      volatility["volatility_annualized"] !== null) ||
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
    (typeof drawdown["max_drawdown_pct"] !== "number" &&
      drawdown["max_drawdown_pct"] !== null) ||
    typeof drawdown["period_days"] !== "number" ||
    (typeof drawdown["recovery_needed_percentage"] !== "number" &&
      drawdown["recovery_needed_percentage"] !== null)
  ) {
    return false;
  }

  // Validate optional sharpe_ratio data structure
  if (riskSummary["sharpe_ratio"]) {
    const sharpeRatio = riskSummary["sharpe_ratio"] as Record<string, unknown>;
    if (
      (typeof sharpeRatio["sharpe_ratio"] !== "number" &&
        sharpeRatio["sharpe_ratio"] !== null) ||
      (typeof sharpeRatio["portfolio_return_annual"] !== "number" &&
        sharpeRatio["portfolio_return_annual"] !== null) ||
      (typeof sharpeRatio["risk_free_rate_annual"] !== "number" &&
        sharpeRatio["risk_free_rate_annual"] !== null) ||
      (typeof sharpeRatio["excess_return"] !== "number" &&
        sharpeRatio["excess_return"] !== null) ||
      (typeof sharpeRatio["volatility_annual"] !== "number" &&
        sharpeRatio["volatility_annual"] !== null) ||
      (typeof sharpeRatio["interpretation"] !== "string" &&
        sharpeRatio["interpretation"] !== null) ||
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

  // Validate summary metrics (allow null for insufficient data)
  const hasVolatilityField =
    typeof summaryMetrics["annualized_volatility_percentage"] === "number" ||
    summaryMetrics["annualized_volatility_percentage"] === null;

  const hasDrawdownPct =
    typeof summaryMetrics["max_drawdown_pct"] === "number" ||
    summaryMetrics["max_drawdown_pct"] === null;

  const hasDrawdownPercentageAlias =
    typeof summaryMetrics["max_drawdown_percentage"] === "number" ||
    summaryMetrics["max_drawdown_percentage"] === null;

  if (!hasVolatilityField) {
    return false;
  }

  // Accept either canonical max_drawdown_pct or alias max_drawdown_percentage
  if (!hasDrawdownPct && !hasDrawdownPercentageAlias) {
    return false;
  }

  // Validate optional sharpe_ratio in summary metrics
  if (
    summaryMetrics["sharpe_ratio"] !== undefined &&
    typeof summaryMetrics["sharpe_ratio"] !== "number" &&
    summaryMetrics["sharpe_ratio"] !== null
  ) {
    return false;
  }

  return true;
}

/**
 * Normalize backend response differences to a consistent shape for the UI.
 */
function normalizeRiskSummary(
  response: ActualRiskSummaryResponse
): ActualRiskSummaryResponse {
  const drawdownFromSummary =
    response.summary_metrics.max_drawdown_pct ??
    response.summary_metrics.max_drawdown_percentage ??
    null;

  const drawdownData = response.risk_summary.drawdown;

  // Some backends only send the alias; populate the canonical field for consumers.
  const normalizedDrawdownPct =
    drawdownFromSummary ??
    drawdownData?.max_drawdown_pct ??
    drawdownData?.max_drawdown_percentage ??
    null;

  return {
    ...response,
    summary_metrics: {
      ...response.summary_metrics,
      max_drawdown_pct: normalizedDrawdownPct,
    },
  };
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

        const normalized = normalizeRiskSummary(response);

        // Only update state if request wasn't aborted
        if (!signal?.aborted) {
          setData(normalized);
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
    void fetchRiskSummary(controller.signal);

    // Return cleanup function
    return () => {
      controller.abort();
    };
  }, [fetchRiskSummary]);

  const refetch = () => {
    void fetchRiskSummary();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "../contexts/UserContext";
import { portfolioStateUtils } from "@/utils/portfolioTransformers";
import { getPortfolioSummary } from "../services/quantEngine";
import type { AssetCategory, PieChartData } from "../types/portfolio";
import { transformPortfolioSummary } from "../utils/portfolioTransformers";
import { parsePortfolioSummary } from "../schemas/portfolioApi";

export interface UsePortfolioDataReturn {
  totalValue: number | null;
  categories: AssetCategory[] | null;
  pieChartData: PieChartData[] | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  isRetrying: boolean;
}

/**
 * Custom hook for fetching and transforming portfolio data from API
 */
export function usePortfolioData(): UsePortfolioDataReturn {
  const { userInfo, loading: isUserLoading, isConnected } = useUser();
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [categories, setCategories] = useState<AssetCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Calculate pie chart data from categories
  const pieChartData = useMemo(() => {
    if (portfolioStateUtils.hasItems(categories)) {
      return categories.map(cat => ({
        label: cat.name,
        value: cat.totalValue,
        percentage: cat.percentage,
        color: cat.color,
      }));
    }
    return null;
  }, [categories]);

  // Retry function for failed requests
  const retry = useCallback(() => {
    if (!isLoading && !isRetrying) {
      setIsRetrying(true);
      setError(null);
      setRetryTrigger(prev => prev + 1);
    }
  }, [isLoading, isRetrying]);

  useEffect(() => {
    let cancelled = false;

    const fetchPortfolioData = async () => {
      // Reset state when no user
      if (!userInfo?.userId) {
        // Only stop loading if wallet is actually disconnected
        // If wallet is connected but userInfo is null, keep loading (API issue or initial fetch)
        if (!isConnected) {
          setIsLoading(false);
          setIsRetrying(false);
        } else {
          // Wallet is connected but no userInfo - ensure we're in loading state
          if (!isUserLoading && !isLoading) {
            setIsLoading(true);
          }
        }
        setTotalValue(null);
        setCategories(null);
        return;
      }

      setError(null);
      if (!isRetrying) {
        setIsLoading(true);
      }

      try {
        // Fetch raw API response
        const rawResponse = await getPortfolioSummary(userInfo.userId, true);

        // Validate and parse API response with Zod
        const summary = parsePortfolioSummary(rawResponse);

        if (!cancelled) {
          const apiTotalValue = summary.metrics.total_value_usd;
          setTotalValue(Number.isFinite(apiTotalValue) ? apiTotalValue : 0);

          // Transform API response using utility function
          if (portfolioStateUtils.hasItems(summary.categories)) {
            const { categories: transformedCategories } =
              transformPortfolioSummary(summary);
            setCategories(transformedCategories);
          } else {
            setCategories(null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          // Enhanced error handling for validation failures
          let errorMessage = "Failed to load portfolio summary";

          if (e instanceof Error) {
            // Check if it's a validation error
            if (e.message.includes("Portfolio API validation failed")) {
              errorMessage = "Invalid portfolio data received from server";
              console.error("Portfolio API validation error:", e.message);
            } else {
              errorMessage = e.message;
            }
          }

          setError(errorMessage);
          setTotalValue(null);
          setCategories(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRetrying(false);
        }
      }
    };

    fetchPortfolioData();

    return () => {
      cancelled = true;
    };
  }, [userInfo?.userId, isUserLoading, retryTrigger, isRetrying, isConnected]);

  return {
    totalValue,
    categories,
    pieChartData,
    isLoading,
    error,
    retry,
    isRetrying,
  };
}

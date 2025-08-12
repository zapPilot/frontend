import { useEffect, useState, useMemo } from "react";
import { useUser } from "../contexts/UserContext";
import { getPortfolioSummary } from "../services/quantEngine";
import type { AssetCategory, PieChartData } from "../types/portfolio";
import {
  transformPortfolioSummary,
  type ApiPortfolioSummary,
} from "../utils/portfolioTransformers";

export interface UsePortfolioDataReturn {
  totalValue: number | null;
  categories: AssetCategory[] | null;
  pieChartData: PieChartData[] | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching and transforming portfolio data from API
 */
export function usePortfolioData(): UsePortfolioDataReturn {
  const { userInfo, loading: isUserLoading } = useUser();
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [categories, setCategories] = useState<AssetCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate pie chart data from categories
  const pieChartData = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map(cat => ({
        label: cat.name,
        value: cat.totalValue,
        percentage: cat.percentage,
        color: cat.color,
      }));
    }
    return null;
  }, [categories]);

  useEffect(() => {
    let cancelled = false;

    const fetchPortfolioData = async () => {
      // Reset state when no user
      if (!userInfo?.userId) {
        if (!isUserLoading) {
          setIsLoading(false);
        }
        setTotalValue(null);
        setCategories(null);
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const summary = (await getPortfolioSummary(
          userInfo.userId,
          true
        )) as ApiPortfolioSummary;

        if (!cancelled) {
          const apiTotalValue = summary.metrics.total_value_usd;
          setTotalValue(Number.isFinite(apiTotalValue) ? apiTotalValue : 0);

          // Transform API response using utility function
          if (
            summary.categories &&
            Array.isArray(summary.categories) &&
            summary.categories.length > 0
          ) {
            const { categories: transformedCategories } =
              transformPortfolioSummary(summary);
            setCategories(transformedCategories);
          } else {
            setCategories(null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load portfolio summary"
          );
          setTotalValue(null);
          setCategories(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPortfolioData();

    return () => {
      cancelled = true;
    };
  }, [userInfo?.userId, isUserLoading]);

  return {
    totalValue,
    categories,
    pieChartData,
    isLoading,
    error,
  };
}

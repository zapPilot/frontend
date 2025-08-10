import { useCallback, useEffect, useState } from "react";
import {
  getPortfolioTrends,
  transformPortfolioTrends,
} from "../services/quantEngine";
import { PortfolioDataPoint } from "../types/portfolio";

interface UsePortfolioTrendsConfig {
  walletAddress?: string;
  days?: number;
  enabled?: boolean;
}

interface UsePortfolioTrendsReturn {
  data: PortfolioDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  userId: string | null;
}

/**
 * Hook to fetch and transform portfolio trends from quant-engine
 */
export function usePortfolioTrends({
  walletAddress,
  days = 30,
  enabled = true,
}: UsePortfolioTrendsConfig = {}): UsePortfolioTrendsReturn {
  const [data, setData] = useState<PortfolioDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchPortfolioTrends = useCallback(async () => {
    if (!enabled || !walletAddress) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First get user ID by wallet address
      console.log(`Looking up user ID for wallet: ${walletAddress}`);

      // Get user info which includes user_id
      const userResponse = await fetch(
        `http://localhost:8003/api/v1/bundle-addresses/by-wallet/${walletAddress}`
      );

      if (!userResponse.ok) {
        throw new Error(`Failed to get user ID: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      const fetchedUserId = userData.user_id;
      setUserId(fetchedUserId);

      console.log(
        `Found user ID: ${fetchedUserId}, fetching portfolio trends (${days} days)`
      );

      // Fetch portfolio trends with the retrieved user ID
      const trendsData = await getPortfolioTrends(fetchedUserId, days);
      console.log(
        `Received ${trendsData.length} data points from quant-engine`
      );

      // Transform the data for charting
      const transformedData = transformPortfolioTrends(trendsData);
      console.log(`Transformed to ${transformedData.length} chart data points`);

      setData(transformedData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch portfolio trends";
      console.error("Portfolio trends error:", errorMessage);
      setError(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, days, enabled]);

  const refetch = useCallback(async () => {
    await fetchPortfolioTrends();
  }, [fetchPortfolioTrends]);

  useEffect(() => {
    fetchPortfolioTrends();
  }, [fetchPortfolioTrends]);

  return {
    data,
    loading,
    error,
    refetch,
    userId,
  };
}

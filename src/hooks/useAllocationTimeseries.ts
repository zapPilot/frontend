import { useCallback, useEffect, useState } from "react";
import {
  getAllocationTimeseries,
  AllocationTimeseriesResponse,
} from "../services/analyticsService";
import { portfolioLogger } from "../utils/logger";

interface UseAllocationTimeseriesConfig {
  userId?: string | undefined;
  days?: number;
  enabled?: boolean;
}

interface UseAllocationTimeseriesReturn {
  data: AllocationTimeseriesResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  userId: string | null;
}

/**
 * Hook to fetch allocation timeseries data from analytics-engine
 */
export function useAllocationTimeseries({
  userId,
  days = 40,
  enabled = true,
}: UseAllocationTimeseriesConfig = {}): UseAllocationTimeseriesReturn {
  const [data, setData] = useState<AllocationTimeseriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllocationTimeseries = useCallback(async () => {
    if (!userId || !enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allocationData = await getAllocationTimeseries(userId, days);
      setData(allocationData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch allocation timeseries";
      setError(errorMessage);
      portfolioLogger.error("Allocation timeseries fetch error", err);
      setData(null); // Reset data on error
    } finally {
      setLoading(false);
    }
  }, [userId, days, enabled]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchAllocationTimeseries();
  }, [fetchAllocationTimeseries]);

  return {
    data,
    loading,
    error,
    refetch: fetchAllocationTimeseries,
    userId: userId || null,
  };
}

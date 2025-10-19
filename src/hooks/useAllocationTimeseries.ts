import {
  getAllocationTimeseries,
  AllocationTimeseriesResponse,
} from "../services/analyticsService";
import { useAnalyticsData } from "./useAnalyticsData";

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
 * Consolidates with useAnalyticsData to eliminate duplicate data-fetching logic
 */
export function useAllocationTimeseries({
  userId,
  days = 40,
  enabled = true,
}: UseAllocationTimeseriesConfig = {}): UseAllocationTimeseriesReturn {
  return useAnalyticsData(getAllocationTimeseries, { userId, days, enabled });
}

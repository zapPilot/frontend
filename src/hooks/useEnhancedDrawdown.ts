import { useCallback, useEffect, useState } from "react";
import {
  getEnhancedDrawdownAnalysis,
  EnhancedDrawdownResponse,
} from "../services/analyticsService";
import { portfolioLogger } from "../utils/logger";

interface UseEnhancedDrawdownConfig {
  userId?: string | undefined;
  days?: number;
  enabled?: boolean;
}

interface UseEnhancedDrawdownReturn {
  data: EnhancedDrawdownResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  userId: string | null;
}

/**
 * Hook to fetch enhanced drawdown analysis from analytics-engine
 */
export function useEnhancedDrawdown({
  userId,
  days = 40,
  enabled = true,
}: UseEnhancedDrawdownConfig = {}): UseEnhancedDrawdownReturn {
  const [data, setData] = useState<EnhancedDrawdownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnhancedDrawdown = useCallback(async () => {
    if (!userId || !enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const drawdownData = await getEnhancedDrawdownAnalysis(userId, days);
      setData(drawdownData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch enhanced drawdown analysis";
      setError(errorMessage);
      portfolioLogger.error("Enhanced drawdown fetch error", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, days, enabled]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchEnhancedDrawdown();
  }, [fetchEnhancedDrawdown]);

  return {
    data,
    loading,
    error,
    refetch: fetchEnhancedDrawdown,
    userId: userId || null,
  };
}

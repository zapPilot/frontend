import { useCallback, useEffect, useState } from "react";
import {
  getUnderwaterRecoveryAnalysis,
  UnderwaterRecoveryResponse,
} from "../services/analyticsService";
import { portfolioLogger } from "../utils/logger";

interface UseUnderwaterRecoveryConfig {
  userId?: string | undefined;
  days?: number;
  enabled?: boolean;
}

interface UseUnderwaterRecoveryReturn {
  data: UnderwaterRecoveryResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  userId: string | null;
}

/**
 * Hook to fetch underwater recovery analysis from analytics-engine
 */
export function useUnderwaterRecovery({
  userId,
  days = 40,
  enabled = true,
}: UseUnderwaterRecoveryConfig = {}): UseUnderwaterRecoveryReturn {
  const [data, setData] = useState<UnderwaterRecoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnderwaterRecovery = useCallback(async () => {
    if (!userId || !enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const underwaterData = await getUnderwaterRecoveryAnalysis(userId, days);
      setData(underwaterData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch underwater recovery analysis";
      setError(errorMessage);
      portfolioLogger.error("Underwater recovery fetch error", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, days, enabled]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchUnderwaterRecovery();
  }, [fetchUnderwaterRecovery]);

  return {
    data,
    loading,
    error,
    refetch: fetchUnderwaterRecovery,
    userId: userId || null,
  };
}

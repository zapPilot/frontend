/* jscpd:ignore-start */
/**
 * Regime History Service
 *
 * Fetches market regime transition history for contextual portfolio strategy display.
 * Provides directional information (fromLeft/fromRight) to enable animated transitions
 * and strategic guidance based on regime changes.
 *
 * Backend API: /api/v2/market/regime/history
 */

import { useQuery } from "@tanstack/react-query";

import { createQueryConfig } from "@/hooks/queries/queryDefaults";
import { APIError, httpUtils } from "@/lib/http";
import { queryKeys } from "@/lib/state/queryClient";
import { createServiceCaller } from "@/lib/utils-moved/createServiceCaller";
import {
  type DirectionType,
  type DurationInfo,
  type RegimeHistoryResponse,
  type RegimeId,
  type RegimeTransition,
  validateRegimeHistoryResponse,
} from "@/schemas/api/regimeHistorySchemas";
import { logger } from "@/utils/logger";

const REGIME_HISTORY_CACHE_MS = 60 * 1000; // 60 seconds (aligned with sentiment)

/**
 * Frontend Data Model for regime history with computed fields
 *
 * Extends the backend response with convenience fields for UI consumption.
 */
export interface RegimeHistoryData {
  /** Current active regime */
  currentRegime: RegimeId;
  /** Previous regime (null if no history) */
  previousRegime: RegimeId | null;
  /** Computed strategy direction for animation/display */
  direction: DirectionType;
  /** Duration in current regime */
  duration: DurationInfo;
  /** Full transition records for detailed analysis */
  transitions: RegimeTransition[];
  /** Timestamp of this data */
  timestamp: string;
  /** Whether data was served from cache */
  cached: boolean;
}

/**
 * Default regime history data for graceful degradation
 *
 * Used when:
 * - API request fails
 * - Validation errors occur
 * - Backend endpoint is unavailable
 *
 * Provides neutral defaults that don't disrupt the UI.
 */
export const DEFAULT_REGIME_HISTORY: RegimeHistoryData = {
  currentRegime: "n", // Neutral regime as default
  previousRegime: null,
  direction: "default",
  duration: null,
  transitions: [],
  timestamp: new Date().toISOString(),
  cached: false,
};

/**
 * Error mapper for regime history service
 * Transforms API errors into user-friendly error instances
 */
const createRegimeHistoryServiceError = (error: unknown): APIError => {
  const apiError =
    error && typeof error === "object"
      ? (error as {
          status?: number;
          message?: string;
          code?: string;
          details?: Record<string, unknown>;
        })
      : {};
  const status = apiError.status || 500;
  let message = apiError.message || "Failed to fetch regime history";

  // Enhanced error messages based on status code
  switch (status) {
    case 503:
      message =
        "Regime history data is temporarily unavailable. Using default values.";
      break;
    case 504:
      message =
        "Request timed out while fetching regime history. Using default values.";
      break;
    case 502:
      message = "Invalid regime data received. Using default values.";
      break;
    case 500:
      message =
        "An unexpected error occurred while fetching regime history. Using default values.";
      break;
    case 404:
      message =
        "Regime history endpoint not found. Using default values. (This is expected if backend v2 is not deployed)";
      break;
  }

  return new APIError(message, status, apiError.code, apiError.details);
};

const callRegimeHistoryApi = createServiceCaller(
  createRegimeHistoryServiceError
);

/**
 * Transform backend response to frontend format
 */
function transformRegimeHistoryData(
  response: RegimeHistoryResponse
): RegimeHistoryData {
  return {
    currentRegime: response.current.regime,
    previousRegime: response.previous?.regime ?? null,
    direction: response.direction,
    duration: response.duration_in_current,
    transitions: response.transitions,
    timestamp: response.timestamp,
    cached: response.cached ?? false,
  };
}

/**
 * Fetch regime history from backend API endpoint
 *
 * Calls `/api/v2/market/regime/history?limit=2` to get current and previous regime.
 * Backend handles regime detection, caching, and direction computation.
 *
 * @param limit - Number of transitions to fetch (default: 2 for current + previous)
 * @returns Regime history data with directional information
 */
export async function fetchRegimeHistory(
  limit = 2
): Promise<RegimeHistoryData> {
  return callRegimeHistoryApi(async () => {
    const response = await httpUtils.analyticsEngine.get(
      `/api/v2/market/regime/history?limit=${limit}`
    );

    const validatedResponse = validateRegimeHistoryResponse(response);
    return transformRegimeHistoryData(validatedResponse);
  });
}

/**
 * React Query hook for regime history with caching and graceful error handling
 *
 * Configuration:
 * - Frontend cache: 60 seconds (aligned with sentiment data)
 * - Auto refetch: Every 60 seconds
 * - Retry: Once on failure
 * - Error handling: Never throws, returns DEFAULT_REGIME_HISTORY on error
 *
 * The hook is designed to fail gracefully - errors are logged but don't
 * disrupt the UI. Portfolio display continues with default neutral regime.
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useRegimeHistory();
 *
 * // data is always defined, never null
 * // errors are handled silently
 * if (data.previousRegime) {
 *   // Show directional strategy
 * }
 * ```
 */
export function useRegimeHistory() {
  return useQuery({
    ...createQueryConfig({ dataType: "dynamic" }),
    queryKey: queryKeys.sentiment.regimeHistory(),
    queryFn: async () => {
      try {
        return await fetchRegimeHistory(2);
      } catch (error) {
        // Log error for debugging but don't throw
        logger.error("Failed to fetch regime history, using defaults", {
          error: error instanceof Error ? error.message : String(error),
          status: error instanceof APIError ? error.status : undefined,
        });

        // Return default data instead of throwing
        return DEFAULT_REGIME_HISTORY;
      }
    },
    staleTime: REGIME_HISTORY_CACHE_MS,
    gcTime: REGIME_HISTORY_CACHE_MS * 3,
    refetchInterval: REGIME_HISTORY_CACHE_MS,
    retry: 1,
    // Critical: Return default data on error, never leave data undefined
    placeholderData: DEFAULT_REGIME_HISTORY,
  });
}
/* jscpd:ignore-end */

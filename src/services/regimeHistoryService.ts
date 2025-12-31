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

import { APIError, httpUtils } from "@/lib/http";
import { createErrorMapper } from "@/lib/http/createErrorMapper";
import { createServiceCaller } from "@/lib/http/createServiceCaller";
import {
  type DirectionType,
  type DurationInfo,
  type RegimeHistoryResponse,
  type RegimeId,
  type RegimeTransition,
  validateRegimeHistoryResponse,
} from "@/schemas/api/regimeHistorySchemas";

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
 * Error mapper for regime history service using standardized createErrorMapper utility
 * Transforms API errors into user-friendly error instances
 */
const createRegimeHistoryServiceError = createErrorMapper(
  (message, status, code, details) =>
    new APIError(message, status, code, details),
  {
    404: "Regime history endpoint not found. Using default values. (This is expected if backend v2 is not deployed)",
    500: "An unexpected error occurred while fetching regime history. Using default values.",
    502: "Invalid regime data received. Using default values.",
    503: "Regime history data is temporarily unavailable. Using default values.",
    504: "Request timed out while fetching regime history. Using default values.",
  },
  "Failed to fetch regime history"
);

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
    currentRegime: response.current.to_regime,
    previousRegime: response.previous?.to_regime ?? null,
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

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * @deprecated Import from @/hooks/queries/market/useRegimeHistoryQuery instead
 *
 * React hooks have been moved out of service files to maintain architectural
 * purity. Service files should only contain pure async functions.
 */
export { useRegimeHistory } from "@/hooks/queries/market/useRegimeHistoryQuery";
/* jscpd:ignore-end */

import { z } from "zod";

/**
 * Zod schemas for regime history API responses
 *
 * These schemas provide runtime validation for regime transition data,
 * ensuring type safety and catching malformed data before it causes runtime errors.
 *
 * Regime history provides contextual information about market regime transitions
 * to enable directional portfolio strategy visualization.
 */

// ============================================================================
// REGIME HISTORY SCHEMAS
// ============================================================================

/**
 * Valid regime identifiers
 *
 * - ef: Extreme Fear (0-24)
 * - f: Fear (25-44)
 * - n: Neutral (45-55)
 * - g: Greed (56-75)
 * - eg: Extreme Greed (76-100)
 */
export const regimeIdSchema = z.enum(["ef", "f", "n", "g", "eg"]);

/**
 * Direction type indicates the strategy transition pattern
 *
 * - fromLeft: Transitioning from a more bearish regime (lower fear/greed index)
 * - fromRight: Transitioning from a more bullish regime (higher fear/greed index)
 * - default: No clear directional context (first load, invalid data, etc.)
 */
export const directionTypeSchema = z.enum(["fromLeft", "fromRight", "default"]);

/**
 * Duration information for time spent in current regime
 */
export const durationInfoSchema = z
  .object({
    /** Number of milliseconds in current regime */
    milliseconds: z.number().int().nonnegative(),
    /** Number of seconds in current regime */
    seconds: z.number().int().nonnegative(),
    /** Number of minutes in current regime */
    minutes: z.number().int().nonnegative(),
    /** Number of hours in current regime */
    hours: z.number().int().nonnegative(),
    /** Number of days in current regime */
    days: z.number().int().nonnegative(),
    /** Human-readable duration string (e.g., "2 days, 5 hours") */
    human_readable: z.string(),
  })
  .nullable();

/**
 * A single regime transition record
 *
 * Tracks when a regime change occurred and what the new regime became.
 */
export const regimeTransitionSchema = z.object({
  /** Unique identifier for this transition record */
  regime_id: z.string(),
  /** The regime that this transition represents */
  regime: regimeIdSchema,
  /** ISO 8601 timestamp of when this regime was activated */
  timestamp: z.string(),
  /** Optional Fear & Greed Index value at time of transition (0-100) */
  sentiment_value: z.number().int().min(0).max(100).optional(),
});

/**
 * Complete regime history API response from /api/v2/market/regime/history
 *
 * Provides current regime, previous regime, and transition direction
 * for contextual portfolio strategy visualization.
 */
export const regimeHistoryResponseSchema = z.object({
  /** Current active regime transition */
  current: regimeTransitionSchema,
  /** Previous regime transition (null if no history available) */
  previous: regimeTransitionSchema.nullable(),
  /** Computed direction based on regime transition pattern */
  direction: directionTypeSchema,
  /** Duration information for time spent in current regime */
  duration_in_current: durationInfoSchema,
  /** Array of recent regime transitions (includes current and previous) */
  transitions: z.array(regimeTransitionSchema),
  /** ISO 8601 timestamp when this response was generated */
  timestamp: z.string(),
  /** Whether this response was served from cache */
  cached: z.boolean().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type inference from schemas
 * These types are automatically generated from the Zod schemas
 */
export type RegimeId = z.infer<typeof regimeIdSchema>;
export type DirectionType = z.infer<typeof directionTypeSchema>;
export type DurationInfo = z.infer<typeof durationInfoSchema>;
export type RegimeTransition = z.infer<typeof regimeTransitionSchema>;
export type RegimeHistoryResponse = z.infer<typeof regimeHistoryResponseSchema>;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validates regime history API response data
 * Returns validated data or throws ZodError with detailed error messages
 *
 * @param data - Unknown data to validate
 * @returns Validated regime history response
 * @throws {ZodError} If validation fails
 */
export function validateRegimeHistoryResponse(
  data: unknown
): RegimeHistoryResponse {
  return regimeHistoryResponseSchema.parse(data);
}

/**
 * Safe validation that returns result with success/error information
 * Useful for cases where you want to handle validation errors gracefully
 *
 * @param data - Unknown data to validate
 * @returns Safe parse result with success flag and data/error
 */
export function safeValidateRegimeHistoryResponse(data: unknown) {
  return regimeHistoryResponseSchema.safeParse(data);
}

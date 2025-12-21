/**
 * Chart Data Transformation Utilities
 *
 * Centralized utilities for transforming chart data to reduce duplication.
 */

// createLoadingState, createErrorState, transformDrawdownPoint removed - unused

/**
 * Point transformation type for volatility data
 * Internal type - not part of public API
 */
interface VolatilityPoint {
  date: string;
  annualized_volatility_pct: number | null;
  rolling_volatility_daily_pct: number | null;
}

/**
 * Transforms volatility data points to standardized format
 */
export function transformVolatilityPoint(point: {
  date: string;
  annualized_volatility_pct?: number | null | undefined;
  rolling_volatility_daily_pct?: number | null | undefined;
}): VolatilityPoint {
  return {
    date: point.date,
    annualized_volatility_pct:
      point.annualized_volatility_pct !== undefined
        ? point.annualized_volatility_pct
        : null,
    rolling_volatility_daily_pct:
      point.rolling_volatility_daily_pct !== undefined
        ? point.rolling_volatility_daily_pct
        : null,
  };
}

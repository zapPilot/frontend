/**
 * Chart Data Transformation Utilities
 *
 * Centralized utilities for transforming chart data to reduce duplication.
 */

/**
 * Creates a standardized loading state configuration
 */
export function createLoadingState(
  externalLoading: boolean | undefined,
  hasPreloadedData: boolean,
  isDashboardLoading: boolean
): boolean {
  return Boolean(externalLoading) || (!hasPreloadedData && isDashboardLoading);
}

/**
 * Creates a standardized error state
 */
export function createErrorState(
  normalizedError: string | null | undefined,
  dashboardError: { message?: string } | null | undefined
): string | null {
  return normalizedError ?? dashboardError?.message ?? null;
}

/**
 * Point transformation type for volatility data
 */
export interface VolatilityPoint {
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
    annualized_volatility_pct: point.annualized_volatility_pct !== undefined ? point.annualized_volatility_pct : null,
    rolling_volatility_daily_pct: point.rolling_volatility_daily_pct !== undefined ? point.rolling_volatility_daily_pct : null,
  };
}

/**
 * Point transformation type for drawdown data
 */
export interface DrawdownPoint {
  date: string;
  drawdown: number;
}

/**
 * Transforms drawdown data points to standardized format
 */
export function transformDrawdownPoint(point: {
  date: string;
  drawdown?: number;
  drawdown_pct?: number;
}): DrawdownPoint {
  return {
    date: point.date,
    drawdown: Number(point.drawdown ?? point.drawdown_pct ?? 0),
  };
}

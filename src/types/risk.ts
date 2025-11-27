/**
 * Risk assessment types for portfolio analysis
 */

export type RiskLevel = "Low" | "Medium" | "High" | "Very High";

/**
 * Period information for risk analysis
 */
interface PeriodInfo {
  start_date: string;
  end_date: string;
  days: number;
}

/**
 * Volatility analysis data structure
 * Note: Numeric fields may be null when insufficient data exists for calculation
 */
interface VolatilityData {
  user_id: string;
  period_days: number;
  data_points: number;
  volatility_daily: number | null;
  volatility_annualized: number | null;
  average_daily_return: number | null;
  period: PeriodInfo;
  period_info: PeriodInfo; // Backward compatibility - same as period
}

/**
 * Drawdown analysis data structure
 * Note: Numeric fields may be null when insufficient data exists for calculation
 */
interface DrawdownData {
  user_id: string;
  period_days: number;
  data_points: number;
  /** Maximum drawdown as negative percentage (e.g., -25.5 for -25.5%) */
  max_drawdown_pct: number | null;
  /** Some API variants use this alias instead of max_drawdown_pct */
  max_drawdown_percentage?: number | null;
  /** Maximum drawdown as negative ratio (e.g., -0.255 for -25.5%) - legacy field */
  max_drawdown: number | null;
  /** Date of maximum drawdown (ISO date string) */
  max_drawdown_date: string | null;
  /** Duration in days from peak to trough, when provided */
  drawdown_duration_days?: number | null;
  /** Date of trough (ISO datetime string) */
  trough_date?: string | null;
  /** Date of peak before drawdown (ISO datetime string) */
  peak_date?: string | null;
  peak_value: number | null;
  trough_value: number | null;
  recovery_needed_percentage: number | null;
  current_drawdown: number | null;
  current_drawdown_percentage: number | null;
  message?: string | null;
  period: PeriodInfo;
  period_info: PeriodInfo; // Backward compatibility - same as period
}

/**
 * Summary metrics for portfolio risk
 * Note: Metrics may be null when insufficient data exists for calculation
 * Backend provides rounded values (3 decimal precision)
 */
interface SummaryMetrics {
  annualized_volatility_percentage: number | null;
  /** Maximum drawdown as negative percentage (e.g., -25.5 for -25.5%) */
  max_drawdown_pct: number | null;
  /**
   * Some API versions return this alias instead of max_drawdown_pct.
   * Keep it optional and normalize in the hook.
   */
  max_drawdown_percentage?: number | null;
  sharpe_ratio?: number | null;
}

/**
 * Sharpe ratio analysis data structure
 * Note: Numeric fields may be null when insufficient data exists for calculation
 */
interface SharpeRatioData {
  user_id: string;
  period_days: number;
  data_points: number;
  sharpe_ratio: number | null;
  portfolio_return_annual: number | null;
  risk_free_rate_annual: number | null;
  excess_return: number | null;
  volatility_annual: number | null;
  interpretation: string | null;
  period: PeriodInfo;
  period_info: PeriodInfo; // Backward compatibility - same as period
}

/**
 * Risk summary data structure
 */
interface RiskSummaryData {
  volatility: VolatilityData;
  drawdown: DrawdownData;
  sharpe_ratio?: SharpeRatioData;
}

/**
 * Actual API response structure for risk summary endpoint
 * This matches the real API response format
 */
export interface ActualRiskSummaryResponse {
  /** User ID this risk assessment belongs to */
  user_id: string;
  /** Detailed risk analysis data */
  risk_summary: RiskSummaryData;
  /** Summary metrics and overall risk score */
  summary_metrics: SummaryMetrics;
}

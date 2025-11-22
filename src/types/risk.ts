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
  period_info: PeriodInfo;
}

/**
 * Drawdown analysis data structure
 * Note: Numeric fields may be null when insufficient data exists for calculation
 */
interface DrawdownData {
  user_id: string;
  period_days: number;
  data_points: number;
  max_drawdown: number | null;
  max_drawdown_percentage: number | null;
  max_drawdown_date: string | null;
  peak_value: number | null;
  trough_value: number | null;
  recovery_needed_percentage: number | null;
  current_drawdown: number | null;
  current_drawdown_percentage: number | null;
  period_info: PeriodInfo;
}

/**
 * Summary metrics for portfolio risk
 * Note: Metrics may be null when insufficient data exists for calculation
 */
interface SummaryMetrics {
  annualized_volatility_percentage: number | null;
  max_drawdown_percentage: number | null;
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
  period_info: PeriodInfo;
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

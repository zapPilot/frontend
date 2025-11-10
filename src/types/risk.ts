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
 */
interface VolatilityData {
  user_id: string;
  period_days: number;
  data_points: number;
  volatility_daily: number;
  volatility_annualized: number;
  average_daily_return: number;
  period_info: PeriodInfo;
}

/**
 * Drawdown analysis data structure
 */
interface DrawdownData {
  user_id: string;
  period_days: number;
  data_points: number;
  max_drawdown: number;
  max_drawdown_percentage: number;
  max_drawdown_date: string;
  peak_value: number;
  trough_value: number;
  recovery_needed_percentage: number;
  current_drawdown: number;
  current_drawdown_percentage: number;
  period_info: PeriodInfo;
}

/**
 * Summary metrics for portfolio risk
 */
interface SummaryMetrics {
  annualized_volatility_percentage: number;
  max_drawdown_percentage: number;
  sharpe_ratio?: number;
}

/**
 * Sharpe ratio analysis data structure
 */
interface SharpeRatioData {
  user_id: string;
  period_days: number;
  data_points: number;
  sharpe_ratio: number;
  portfolio_return_annual: number;
  risk_free_rate_annual: number;
  excess_return: number;
  volatility_annual: number;
  interpretation: string;
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

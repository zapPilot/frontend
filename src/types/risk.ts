/**
 * Risk assessment types for portfolio analysis
 */

export type RiskLevel = "Low" | "Medium" | "High" | "Very High";

/**
 * Individual risk metric data structure
 * @deprecated Use ActualRiskSummaryResponse for new implementations
 */
export interface RiskMetric {
  /** Unique identifier for the risk metric (e.g., 'concentration', 'correlation') */
  id: string;
  /** Display name for the metric (e.g., 'Concentration Risk') */
  name: string;
  /** Numeric value of the risk metric */
  value: number;
  /** Unit of measurement ('%', 'ratio', or null for unitless) */
  unit: "%" | "ratio" | null;
  /** Risk severity level */
  level: RiskLevel;
  /** Brief description for tooltips or additional context */
  description: string;
}

/**
 * Legacy API response structure for risk summary endpoint
 * @deprecated Use ActualRiskSummaryResponse for new implementations
 */
export interface RiskSummaryResponse {
  /** User ID this risk assessment belongs to */
  user_id: string;
  /** Overall portfolio risk level (optional for partial responses) */
  overall_risk_level?: RiskLevel;
  /** Array of individual risk metrics (optional for partial responses) */
  metrics?: RiskMetric[];
  /** Timestamp of when the assessment was last updated (optional) */
  last_updated?: string;
}

/**
 * Period information for risk analysis
 */
export interface PeriodInfo {
  start_date: string;
  end_date: string;
}

/**
 * Volatility analysis data structure
 */
export interface VolatilityData {
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
export interface DrawdownData {
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
 * Risk score components
 */
export interface RiskScore {
  score: number;
  level: string;
  volatility_component: number;
  drawdown_component: number;
}

/**
 * Summary metrics for portfolio risk
 */
export interface SummaryMetrics {
  annualized_volatility_percentage: number;
  max_drawdown_percentage: number;
  risk_score: RiskScore;
}

/**
 * Risk summary data structure
 */
export interface RiskSummaryData {
  volatility: VolatilityData;
  drawdown: DrawdownData;
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

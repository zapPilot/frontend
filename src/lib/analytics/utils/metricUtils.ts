import type { UnifiedDashboardResponse } from "@/services/analyticsService";
import type { MetricData } from "@/types/analytics";

/**
 * Create placeholder metric for missing data
 */
export function createPlaceholderMetric(
  value: string,
  subValue: string
): MetricData {
  return {
    value,
    subValue,
    trend: "neutral",
  };
}

/**
 * Get Sharpe ratio percentile (mock calculation)
 */
export function getSharpePercentile(sharpe: number): number {
  if (sharpe > 3) return 1;
  if (sharpe > 2) return 5;
  if (sharpe > 1.5) return 10;
  if (sharpe > 1) return 25;
  return 50;
}

/**
 * Safely extract drawdown summary data from response
 */
export function extractDrawdownSummary(
  dashboard: UnifiedDashboardResponse | undefined
) {
  const drawdownAnalysis = dashboard?.drawdown_analysis as any;

  return {
    maxDrawdownPct: drawdownAnalysis?.enhanced?.summary?.max_drawdown_pct ?? 0,
    maxDrawdownDate:
      drawdownAnalysis?.enhanced?.summary?.max_drawdown_date ??
      new Date().toISOString(),
    recoveryDays: drawdownAnalysis?.enhanced?.summary?.recovery_days ?? 0,
    underwaterData:
      drawdownAnalysis?.underwater_recovery?.underwater_data ?? [],
  };
}

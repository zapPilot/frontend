/**
 * Analytics Data Transformers
 *
 * Pure functions to transform API responses into chart/metric display formats.
 * Zero dependencies - enables isolated unit testing.
 */

import type {
  DailyYieldReturnsResponse,
  UnifiedDashboardResponse,
} from "@/services/analyticsService";
import type { BtcPriceSnapshot } from "@/services/btcPriceService";
import type {
  DrawdownChartData,
  KeyMetrics,
  MetricData,
  MonthlyPnL,
  PerformanceChartData,
} from "@/types/analytics";

const toDateKey = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match?.[1]) {
    return match[1];
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};

const buildDateRange = (values: { date?: string }[]) => ({
  startDate: toDateKey(values[0]?.date) ?? new Date().toISOString(),
  endDate:
    toDateKey(values[values.length - 1]?.date) ?? new Date().toISOString(),
});

// ============================================================================
// CHART TRANSFORMERS
// ============================================================================

/**
 * Transform dashboard trends to Performance Chart SVG points
 *
 * Normalizes portfolio values to 0-100 SVG scale (inverted Y-axis).
 * Adds BTC benchmark line for comparison using real price data.
 *
 * @param dashboard - Unified dashboard response with trends data
 * @param btcPriceData - Real BTC price snapshots from API (optional)
 * @returns Performance chart data ready for SVG rendering
 */
export function transformToPerformanceChart(
  dashboard: UnifiedDashboardResponse | undefined,
  btcPriceData?: BtcPriceSnapshot[]
): PerformanceChartData {
  const dailyValues = dashboard?.trends?.daily_values ?? [];

  if (dailyValues.length === 0) {
    return {
      points: [],
      ...buildDateRange(dailyValues),
    };
  }

  // Extract portfolio values
  const portfolioValues = dailyValues
    .map(d => d.total_value_usd ?? 0)
    .filter(v => v > 0);

  if (portfolioValues.length === 0) {
    return {
      points: [],
      ...buildDateRange(dailyValues),
    };
  }

  // Calculate min/max for normalization
  const min = Math.min(...portfolioValues);
  const max = Math.max(...portfolioValues);
  const range = max - min;

  // Build BTC price map for lookup
  const btcPriceMap = new Map(
    (btcPriceData ?? []).flatMap(snap => {
      const dateKey = toDateKey(snap.date);
      if (!dateKey) {
        return [];
      }
      return [[dateKey, snap.price_usd] as const];
    })
  );

  // Get first portfolio value
  const firstPortfolioValue = dailyValues[0]?.total_value_usd ?? 0;

  // Find first available BTC price within portfolio date range
  let firstBtcPrice: number | null = null;
  let firstBtcDate: string | null = null;

  for (const dailyValue of dailyValues) {
    const dateKey = toDateKey(dailyValue.date);
    if (dateKey) {
      const btcPrice = btcPriceMap.get(dateKey);
      if (btcPrice) {
        firstBtcPrice = btcPrice;
        firstBtcDate = dateKey;
        break; // Use first available BTC price as baseline
      }
    }
  }

  // Adjust portfolio baseline to match BTC baseline date
  let baselinePortfolioValue = firstPortfolioValue;
  if (firstBtcDate) {
    const baselineDaily = dailyValues.find(
      d => toDateKey(d.date) === firstBtcDate
    );
    if (baselineDaily?.total_value_usd) {
      baselinePortfolioValue = baselineDaily.total_value_usd;
    }
  }

  // Normalize to 0-100 scale (inverted Y-axis for SVG)
  const points = dailyValues.map((d, idx) => {
    const value = d.total_value_usd ?? min;
    const normalizedPortfolio =
      range > 0 ? 100 - ((value - min) / range) * 100 : 50;

    // Calculate real BTC benchmark if data available
    const dateKey = toDateKey(d.date);
    let btcEquivalentValue: number | null = null; // Only use real BTC data
    if (firstBtcPrice && baselinePortfolioValue > 0 && dateKey) {
      const currentBtcPrice = btcPriceMap.get(dateKey);
      if (currentBtcPrice) {
        // What would baseline portfolio value be worth if invested in BTC?
        btcEquivalentValue =
          (baselinePortfolioValue / firstBtcPrice) * currentBtcPrice;
      }
      // If currentBtcPrice is undefined, btcEquivalentValue remains null
    }

    // Normalize BTC benchmark to same scale as portfolio (only if we have real data)
    const normalizedBTC =
      btcEquivalentValue !== null && range > 0
        ? 100 - ((btcEquivalentValue - min) / range) * 100
        : null; // Skip normalization if no data

    return {
      x: (idx / (dailyValues.length - 1)) * 100,
      portfolio: normalizedPortfolio,
      btc:
        normalizedBTC !== null
          ? Math.max(0, Math.min(100, normalizedBTC))
          : null, // Clamp to 0-100 or null
      date: dateKey ?? d.date ?? new Date().toISOString(),
      portfolioValue: value,
      btcBenchmarkValue: btcEquivalentValue, // null if data unavailable
    };
  });

  return {
    points,
    ...buildDateRange(dailyValues),
  };
}

/**
 * Transform drawdown analysis to Drawdown Chart underwater data
 *
 * Maps underwater_recovery data to SVG points for visualization.
 *
 * @param dashboard - Unified dashboard response with drawdown analysis
 * @returns Drawdown chart data ready for SVG rendering
 */
export function transformToDrawdownChart(
  dashboard: UnifiedDashboardResponse | undefined
): DrawdownChartData {
  // Extract drawdown data (loosely typed as Record<string, unknown>)
  const drawdownAnalysis = dashboard?.drawdown_analysis as
    | {
        enhanced?: {
          summary?: {
            max_drawdown_pct?: number;
            max_drawdown_date?: string;
          };
        };
        underwater_recovery?: {
          underwater_data?: {
            date?: string;
            drawdown_pct?: number;
          }[];
        };
      }
    | undefined;

  const underwaterData =
    drawdownAnalysis?.underwater_recovery?.underwater_data ?? [];
  const maxDrawdown =
    drawdownAnalysis?.enhanced?.summary?.max_drawdown_pct ?? 0;
  const maxDrawdownDate =
    drawdownAnalysis?.enhanced?.summary?.max_drawdown_date ??
    new Date().toISOString();

  if (underwaterData.length === 0) {
    return {
      points: [{ x: 0, value: 0, date: new Date().toISOString() }],
      maxDrawdown: 0,
      maxDrawdownDate: new Date().toISOString(),
    };
  }

  // Normalize to 0-100 x-axis scale
  const points = underwaterData.map((d, idx) => ({
    x: (idx / (underwaterData.length - 1)) * 100,
    value: d.drawdown_pct ?? 0, // Already in percentage (negative values)
    date: d.date ?? new Date().toISOString(), // Add date for tooltip
  }));

  return {
    points,
    maxDrawdown,
    maxDrawdownDate,
  };
}

// ============================================================================
// METRIC CALCULATORS
// ============================================================================

/**
 * Calculate key metrics from dashboard data
 *
 * Derives all 8 analytics metrics (4 primary + 4 additional).
 *
 * @param dashboard - Unified dashboard response
 * @returns Complete key metrics for display
 */
export function calculateKeyMetrics(
  dashboard: UnifiedDashboardResponse | undefined
): KeyMetrics {
  const dailyValues = dashboard?.trends?.daily_values ?? [];
  const drawdownAnalysis = dashboard?.drawdown_analysis as
    | {
        enhanced?: {
          summary?: {
            max_drawdown_pct?: number;
            recovery_days?: number;
          };
        };
      }
    | undefined;

  const rollingAnalytics = dashboard?.rolling_analytics;

  // Calculate Time-Weighted Return (TWR)
  const timeWeightedReturn = calculateTWR(dailyValues);

  // Extract Max Drawdown
  const maxDrawdown = extractMaxDrawdown(drawdownAnalysis);

  // Extract Sharpe Ratio
  const sharpe = extractSharpe(rollingAnalytics);

  // Calculate Win Rate
  const winRate = calculateWinRate(dailyValues);

  // Extract Volatility
  const volatility = extractVolatility(rollingAnalytics);

  // Optional metrics (may not be in API yet)
  const sortino = createPlaceholderMetric("N/A", "Coming soon");
  const beta = createPlaceholderMetric("N/A", "vs BTC");
  const alpha = createPlaceholderMetric("N/A", "vs BTC");

  return {
    timeWeightedReturn,
    maxDrawdown,
    sharpe,
    winRate,
    volatility,
    sortino,
    beta,
    alpha,
  };
}

/**
 * Calculate Time-Weighted Return from daily values
 */
function calculateTWR(
  dailyValues: { total_value_usd?: number; date?: string }[]
): MetricData {
  if (dailyValues.length < 2) {
    return createPlaceholderMetric("0%", "Insufficient data");
  }

  const firstValue = dailyValues[0]?.total_value_usd ?? 0;
  const lastValue = dailyValues[dailyValues.length - 1]?.total_value_usd ?? 0;

  if (firstValue === 0) {
    return createPlaceholderMetric("0%", "No starting value");
  }

  const returnPct = ((lastValue - firstValue) / firstValue) * 100;
  const isPositive = returnPct > 0;

  return {
    value: `${isPositive ? "+" : ""}${returnPct.toFixed(1)}%`,
    subValue: `${isPositive ? "+" : ""}${(returnPct - 15).toFixed(1)}% vs BTC`, // Mock BTC comparison
    trend: isPositive ? "up" : "down",
  };
}

/**
 * Extract Max Drawdown from drawdown analysis
 */
function extractMaxDrawdown(
  drawdownAnalysis:
    | {
        enhanced?: {
          summary?: {
            max_drawdown_pct?: number;
            recovery_days?: number;
          };
        };
      }
    | undefined
): MetricData {
  const maxDrawdownPct =
    drawdownAnalysis?.enhanced?.summary?.max_drawdown_pct ?? 0;
  const recoveryDays = drawdownAnalysis?.enhanced?.summary?.recovery_days ?? 0;

  return {
    value: `${maxDrawdownPct.toFixed(1)}%`,
    subValue:
      recoveryDays > 0
        ? `Recovered in ${recoveryDays} days`
        : "Not yet recovered",
    trend: maxDrawdownPct > -15 ? "up" : "down", // Better if closer to 0
  };
}

/**
 * Extract Sharpe Ratio from rolling analytics
 */
function extractSharpe(
  rollingAnalytics: UnifiedDashboardResponse["rolling_analytics"]
): MetricData {
  const sharpeData = rollingAnalytics?.sharpe?.rolling_sharpe_data ?? [];

  if (sharpeData.length === 0) {
    return createPlaceholderMetric("N/A", "No data");
  }

  // Average Sharpe ratio from rolling data
  const validSharpes = sharpeData
    .map(d => d.rolling_sharpe_ratio ?? 0)
    .filter(s => !isNaN(s) && isFinite(s));

  if (validSharpes.length === 0) {
    return createPlaceholderMetric("N/A", "No valid data");
  }

  const avgSharpe =
    validSharpes.reduce((sum, s) => sum + s, 0) / validSharpes.length;
  const percentile = getSharpePercentile(avgSharpe);

  return {
    value: avgSharpe.toFixed(2),
    subValue: `Top ${percentile}% of Pilots`,
    trend: avgSharpe > 1.5 ? "up" : avgSharpe > 0.5 ? "neutral" : "down",
  };
}

/**
 * Calculate Win Rate (% of positive return days)
 */
function calculateWinRate(
  dailyValues: { pnl_percentage?: number }[]
): MetricData {
  if (dailyValues.length === 0) {
    return createPlaceholderMetric("0%", "No data");
  }

  const positiveDays = dailyValues.filter(
    d => (d.pnl_percentage ?? 0) > 0
  ).length;
  const winRatePct = (positiveDays / dailyValues.length) * 100;

  return {
    value: `${winRatePct.toFixed(0)}%`,
    subValue: `${positiveDays} winning days`,
    trend: winRatePct > 50 ? "up" : "down",
  };
}

/**
 * Extract Volatility from rolling analytics
 */
function extractVolatility(
  rollingAnalytics: UnifiedDashboardResponse["rolling_analytics"]
): MetricData {
  const volatilityData =
    rollingAnalytics?.volatility?.rolling_volatility_data ?? [];

  if (volatilityData.length === 0) {
    return createPlaceholderMetric("N/A", "No data");
  }

  // Average annualized volatility
  const validVolatilities = volatilityData
    .map(d => d.annualized_volatility_pct ?? 0)
    .filter(v => !isNaN(v) && isFinite(v));

  if (validVolatilities.length === 0) {
    return createPlaceholderMetric("N/A", "No valid data");
  }

  const avgVolatility =
    validVolatilities.reduce((sum, v) => sum + v, 0) / validVolatilities.length;

  return {
    value: `${avgVolatility.toFixed(1)}%`,
    subValue:
      avgVolatility < 20
        ? "Low risk"
        : avgVolatility < 40
          ? "Moderate"
          : "High risk",
    trend: avgVolatility < 25 ? "up" : "down", // Lower is better
  };
}

/**
 * Create placeholder metric for missing data
 */
function createPlaceholderMetric(value: string, subValue: string): MetricData {
  return {
    value,
    subValue,
    trend: "neutral",
  };
}

/**
 * Get Sharpe ratio percentile (mock calculation)
 */
function getSharpePercentile(sharpe: number): number {
  if (sharpe > 3) return 1;
  if (sharpe > 2) return 5;
  if (sharpe > 1.5) return 10;
  if (sharpe > 1) return 25;
  return 50;
}

// ============================================================================
// MONTHLY PNL AGGREGATOR
// ============================================================================

/**
 * Aggregate daily yield returns into monthly PnL percentages
 *
 * Groups daily returns by month and calculates monthly % change.
 *
 * @param dailyReturns - Daily yield returns response
 * @param portfolioValues - Daily portfolio values for % calculation
 * @returns Monthly PnL data for heatmap (last 12 months)
 */
export function aggregateMonthlyPnL(
  dailyReturns: DailyYieldReturnsResponse | undefined,
  portfolioValues: { date?: string; total_value_usd?: number }[] = []
): MonthlyPnL[] {
  if (!dailyReturns?.daily_returns) {
    return [];
  }

  // Group by year-month
  const monthlyMap = new Map<string, number>();

  for (const entry of dailyReturns.daily_returns) {
    if (!entry.date) continue;

    const date = new Date(entry.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    const currentTotal = monthlyMap.get(monthKey) ?? 0;
    monthlyMap.set(monthKey, currentTotal + (entry.yield_return_usd ?? 0));
  }

  // Convert to MonthlyPnL array (last 12 months)
  const monthlyEntries = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12); // Last 12 months

  // Calculate percentage (need month-start portfolio value)
  return monthlyEntries
    .map(([monthKey, yieldUSD]) => {
      const [yearStr, monthStr] = monthKey.split("-");
      const year = parseInt(yearStr ?? "", 10);
      const month = parseInt(monthStr ?? "", 10);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // Validate year and month
      if (
        !year ||
        !month ||
        month < 1 ||
        month > 12 ||
        isNaN(year) ||
        isNaN(month)
      ) {
        return null;
      }

      // Find portfolio value at start of month
      // Use YYYY-MM-01 format to avoid timezone issues (toISOString varies by TZ)
      const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const portfolioValue =
        portfolioValues.find(pv => pv.date && pv.date >= monthStart)
          ?.total_value_usd ?? 100000; // Default to 100k if not found

      const percentageReturn =
        portfolioValue > 0 ? (yieldUSD / portfolioValue) * 100 : 0;

      return {
        month: monthNames[month - 1] ?? "N/A",
        year,
        value: percentageReturn,
      };
    })
    .filter((entry): entry is MonthlyPnL => entry !== null);
}

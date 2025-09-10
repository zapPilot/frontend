/**
 * Portfolio Analytics and Mock Data
 *
 * Handles portfolio analytics calculations, performance metrics, and mock data generation.
 * Consolidates analytics logic from portfolioUtils.ts with clear separation from data processing.
 *
 * @module lib/portfolio-analytics
 */

import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Shield,
  Clock,
  Activity,
  PieChart,
} from "lucide-react";

import type {
  PortfolioDataPoint,
  ChartPeriod,
  AssetAttribution,
  AnalyticsMetric,
  PerformancePeriod,
} from "../types/portfolio";

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

export const CHART_PERIODS: ChartPeriod[] = [
  { label: "1W", value: "1W", days: 7 },
  { label: "1M", value: "1M", days: 30 },
  { label: "3M", value: "3M", days: 90 },
  { label: "6M", value: "6M", days: 180 },
  { label: "1Y", value: "1Y", days: 365 },
  { label: "ALL", value: "ALL", days: 500 },
];

// =============================================================================
// MOCK DATA GENERATION
// =============================================================================

/**
 * Generate portfolio performance history for charts
 *
 * @param period - Time period to generate data for
 * @param baseValue - Starting portfolio value
 * @returns Array of portfolio data points
 */
export function generatePortfolioHistory(
  period: string,
  baseValue = 100000
): PortfolioDataPoint[] {
  const days = CHART_PERIODS.find(p => p.value === period)?.days || 90;
  const data: PortfolioDataPoint[] = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Simulate portfolio performance with some volatility
    const progress = (days - i) / days;
    const trend = Math.sin(progress * Math.PI * 3) * 0.1 + progress * 0.25;
    const noise = (Math.random() - 0.5) * 0.05;
    const value = baseValue * (1 + trend + noise);

    // Simulate benchmark (more stable growth)
    const benchmarkTrend = progress * 0.15;
    const benchmarkNoise = (Math.random() - 0.5) * 0.02;
    const benchmark = baseValue * (1 + benchmarkTrend + benchmarkNoise);

    const change =
      i === days
        ? 0
        : ((value - (data[data.length - 1]?.value || value)) / value) * 100;

    data.push({
      date: date.toISOString().split("T")[0]!,
      value,
      change,
      benchmark,
    });
  }

  return data;
}

/**
 * Generate asset attribution data
 *
 * @returns Array of asset attribution data
 */
export function generateAssetAttribution(): AssetAttribution[] {
  return [
    {
      asset: "BTC",
      contribution: 8.2,
      allocation: 35.2,
      performance: 23.4,
      color: "bg-orange-500",
    },
    {
      asset: "ETH",
      contribution: 5.3,
      allocation: 28.7,
      performance: 18.6,
      color: "bg-blue-500",
    },
    {
      asset: "DeFi Tokens",
      contribution: 4.1,
      allocation: 12.4,
      performance: 33.2,
      color: "bg-purple-500",
    },
    {
      asset: "Stablecoins",
      contribution: 0.8,
      allocation: 20.1,
      performance: 4.2,
      color: "bg-green-500",
    },
    {
      asset: "Altcoins",
      contribution: -1.8,
      allocation: 3.6,
      performance: -48.9,
      color: "bg-red-500",
    },
  ];
}

/**
 * Generate analytics metrics
 *
 * @param sharpeRatio - Optional real Sharpe ratio value to use instead of mock data
 * @returns Array of analytics metrics
 */
export function getAnalyticsMetrics(sharpeRatio?: number): AnalyticsMetric[] {
  return [
    {
      label: "Total Return",
      value: "+24.3%",
      change: 2.4,
      trend: "up",
      icon: TrendingUp,
      description: "All-time portfolio performance",
    },
    {
      label: "Annualized Return",
      value: "+18.7%",
      change: 1.2,
      trend: "up",
      icon: BarChart3,
      description: "Year-over-year performance",
    },
    {
      label: "Risk Score",
      value: "6.2/10",
      change: -0.3,
      trend: "down",
      icon: Shield,
      description: "Portfolio risk assessment",
    },
    {
      label: "Sharpe Ratio",
      value: sharpeRatio ? sharpeRatio.toFixed(2) : "1.34",
      change: sharpeRatio ? (sharpeRatio > 1.5 ? 0.15 : -0.05) : 0.15,
      trend: sharpeRatio ? (sharpeRatio > 1.5 ? "up" : "down") : "up",
      icon: Target,
      description: sharpeRatio
        ? "Risk-adjusted returns"
        : "Risk-adjusted returns (mock)",
    },
    {
      label: "Max Drawdown",
      value: "-12.4%",
      change: 2.1,
      trend: "down",
      icon: TrendingDown,
      description: "Largest peak-to-trough decline",
    },
    {
      label: "Volatility",
      value: "22.8%",
      change: -1.8,
      trend: "up",
      icon: Activity,
      description: "Portfolio standard deviation",
    },
    {
      label: "Active Positions",
      value: "12",
      change: 2,
      trend: "up",
      icon: PieChart,
      description: "Currently held assets",
    },
    {
      label: "Days Invested",
      value: "147",
      change: 1,
      trend: "neutral",
      icon: Clock,
      description: "Portfolio age",
    },
  ];
}

/**
 * Generate performance data for different time periods
 *
 * @param sharpeRatio - Optional real Sharpe ratio value for current period
 * @returns Array of performance period data
 */
export function getPerformanceData(sharpeRatio?: number): PerformancePeriod[] {
  return [
    {
      period: "1D",
      return: 2.34,
      volatility: 1.2,
      sharpe: 1.95,
      maxDrawdown: -0.8,
    },
    {
      period: "1W",
      return: 8.67,
      volatility: 4.3,
      sharpe: 2.01,
      maxDrawdown: -3.2,
    },
    {
      period: "1M",
      return: 12.45,
      volatility: 18.7,
      sharpe: sharpeRatio || 0.67,
      maxDrawdown: -8.9,
    },
    {
      period: "3M",
      return: 18.23,
      volatility: 21.4,
      sharpe: 0.85,
      maxDrawdown: -12.4,
    },
    {
      period: "6M",
      return: 24.89,
      volatility: 22.1,
      sharpe: 1.13,
      maxDrawdown: -15.6,
    },
    {
      period: "1Y",
      return: 18.67,
      volatility: 22.8,
      sharpe: 0.82,
      maxDrawdown: -18.3,
    },
  ];
}

// =============================================================================
// ANALYTICS CALCULATIONS
// =============================================================================

/**
 * Calculate drawdown data from portfolio history
 *
 * @param portfolioHistory - Array of portfolio data points
 * @returns Array of drawdown data points
 */
export function calculateDrawdownData(
  portfolioHistory: PortfolioDataPoint[]
): Array<{ date: string; drawdown: number }> {
  let peak = 0;
  return portfolioHistory.map(point => {
    peak = Math.max(peak, point.value);
    const drawdown = peak > 0 ? ((point.value - peak) / peak) * 100 : 0;
    return {
      date: point.date,
      drawdown,
    };
  });
}

/**
 * Calculate Sharpe ratio
 *
 * @param returns - Array of period returns
 * @param riskFreeRate - Risk-free rate (default: 0.02)
 * @returns Sharpe ratio
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate = 0.02
): number {
  if (returns.length === 0) return 0;

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) /
    returns.length;
  const standardDeviation = Math.sqrt(variance);

  if (standardDeviation === 0) return 0;

  return (meanReturn - riskFreeRate) / standardDeviation;
}

/**
 * Calculate maximum drawdown from portfolio values
 *
 * @param values - Array of portfolio values
 * @returns Maximum drawdown percentage
 */
export function calculateMaxDrawdown(values: number[]): number {
  if (values.length === 0) return 0;

  let maxDrawdown = 0;
  let peak = values[0]!; // We know it exists because we checked length

  for (const value of values) {
    if (value > peak) {
      peak = value;
    } else {
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }

  return maxDrawdown * 100; // Return as percentage
}

/**
 * Calculate portfolio volatility (standard deviation of returns)
 *
 * @param returns - Array of period returns
 * @returns Volatility as percentage
 */
export function calculateVolatility(returns: number[]): number {
  if (returns.length === 0) return 0;

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) /
    returns.length;

  return Math.sqrt(variance) * 100; // Return as percentage
}

/**
 * Calculate beta (correlation with benchmark)
 *
 * @param portfolioReturns - Portfolio returns
 * @param benchmarkReturns - Benchmark returns
 * @returns Beta coefficient
 */
export function calculateBeta(
  portfolioReturns: number[],
  benchmarkReturns: number[]
): number {
  if (
    portfolioReturns.length !== benchmarkReturns.length ||
    portfolioReturns.length === 0
  ) {
    return 1; // Default beta
  }

  const portfolioMean =
    portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
  const benchmarkMean =
    benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;

  let covariance = 0;
  let benchmarkVariance = 0;

  for (let i = 0; i < portfolioReturns.length; i++) {
    const portfolioDiff = portfolioReturns[i]! - portfolioMean;
    const benchmarkDiff = benchmarkReturns[i]! - benchmarkMean;

    covariance += portfolioDiff * benchmarkDiff;
    benchmarkVariance += benchmarkDiff * benchmarkDiff;
  }

  if (benchmarkVariance === 0) return 1;

  return covariance / benchmarkVariance;
}

/**
 * Calculate alpha (excess return over benchmark)
 *
 * @param portfolioReturn - Portfolio return
 * @param benchmarkReturn - Benchmark return
 * @param beta - Beta coefficient
 * @param riskFreeRate - Risk-free rate
 * @returns Alpha
 */
export function calculateAlpha(
  portfolioReturn: number,
  benchmarkReturn: number,
  beta: number,
  riskFreeRate = 0.02
): number {
  return (
    portfolioReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate))
  );
}

// =============================================================================
// PERFORMANCE ANALYSIS
// =============================================================================

/**
 * Analyze portfolio performance over multiple periods
 *
 * @param historicalData - Historical portfolio data
 * @param benchmarkData - Benchmark data for comparison
 * @returns Comprehensive performance analysis
 */
export function analyzePortfolioPerformance(
  historicalData: PortfolioDataPoint[],
  benchmarkData?: PortfolioDataPoint[]
): {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta?: number;
  alpha?: number;
} {
  if (historicalData.length === 0) {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
    };
  }

  const values = historicalData.map(d => d.value);
  const returns = historicalData
    .slice(1)
    .map(
      (d, i) => (d.value - historicalData[i]!.value) / historicalData[i]!.value
    );

  // Basic metrics
  const totalReturn =
    ((values[values.length - 1]! - values[0]!) / values[0]!) * 100;
  const annualizedReturn =
    Math.pow(
      values[values.length - 1]! / values[0]!,
      365 / historicalData.length
    ) - 1;
  const volatility = calculateVolatility(returns);
  const sharpeRatio = calculateSharpeRatio(returns);
  const maxDrawdown = calculateMaxDrawdown(values);

  // Benchmark comparison (if available)
  let beta: number | undefined;
  let alpha: number | undefined;

  if (benchmarkData && benchmarkData.length === historicalData.length) {
    const benchmarkReturns = benchmarkData
      .slice(1)
      .map(
        (d, i) => (d.value - benchmarkData[i]!.value) / benchmarkData[i]!.value
      );
    const benchmarkValues = benchmarkData.map(d => d.value);
    const benchmarkTotalReturn =
      ((benchmarkValues[benchmarkValues.length - 1]! - benchmarkValues[0]!) /
        benchmarkValues[0]!) *
      100;

    beta = calculateBeta(returns, benchmarkReturns);
    alpha = calculateAlpha(totalReturn, benchmarkTotalReturn, beta);
  }

  const result: {
    totalReturn: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta?: number;
    alpha?: number;
  } = {
    totalReturn,
    annualizedReturn: annualizedReturn * 100, // Convert to percentage
    volatility,
    sharpeRatio,
    maxDrawdown,
  };

  if (beta !== undefined) result.beta = beta;
  if (alpha !== undefined) result.alpha = alpha;

  return result;
}

// All functions and constants are already exported above with their declarations

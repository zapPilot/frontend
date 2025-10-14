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
import type { ActualRiskSummaryResponse } from "../types/risk";
import { getVolatilityLevel } from "../utils/risk";

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
 * Generate analytics metrics with real risk data
 *
 * @param riskData - Optional real risk data from API
 * @returns Array of analytics metrics with real or mock data
 */
export function getAnalyticsMetrics(
  riskData?: ActualRiskSummaryResponse
): AnalyticsMetric[] {
  // Extract risk metrics from real data
  const sharpeRatio =
    riskData?.risk_summary?.sharpe_ratio?.sharpe_ratio ||
    riskData?.summary_metrics?.sharpe_ratio;
  const volatilityPct =
    riskData?.summary_metrics?.annualized_volatility_percentage;
  const drawdownPct = riskData?.summary_metrics?.max_drawdown_percentage;
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
      label: "Risk Level",
      value: volatilityPct ? getVolatilityLevel(volatilityPct) : "Medium",
      change: volatilityPct ? (volatilityPct > 50 ? -0.5 : 0.2) : 0,
      trend: volatilityPct ? (volatilityPct > 50 ? "down" : "up") : "neutral",
      icon: Shield,
      description: riskData
        ? "Risk level based on volatility analysis"
        : "Portfolio risk assessment (mock)",
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
      value: drawdownPct ? `${drawdownPct.toFixed(1)}%` : "-12.4%",
      change: drawdownPct ? Math.abs(drawdownPct) * 0.1 : 2.1,
      trend: "down",
      icon: TrendingDown,
      description: riskData
        ? "Largest peak-to-trough portfolio decline"
        : "Largest peak-to-trough decline (mock)",
    },
    {
      label: "Volatility",
      value: volatilityPct ? `${volatilityPct.toFixed(1)}%` : "22.8%",
      change: volatilityPct ? (volatilityPct > 100 ? -2.0 : -0.5) : -1.8,
      trend: volatilityPct ? (volatilityPct > 50 ? "down" : "up") : "up",
      icon: Activity,
      description: riskData
        ? "Annualized portfolio volatility"
        : "Portfolio standard deviation (mock)",
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
 * @param riskData - Optional real risk data from API
 * @returns Array of performance period data with real or mock values
 */
export function getPerformanceData(
  riskData?: ActualRiskSummaryResponse
): PerformancePeriod[] {
  const sharpeRatio =
    riskData?.risk_summary?.sharpe_ratio?.sharpe_ratio ||
    riskData?.summary_metrics?.sharpe_ratio;
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

// All functions and constants are already exported above with their declarations

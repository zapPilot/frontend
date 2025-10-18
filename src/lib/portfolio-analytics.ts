/**
 * Portfolio Analytics and Mock Data
 *
 * Handles portfolio analytics calculations, performance metrics, and mock data generation.
 * Consolidates analytics logic from portfolioUtils.ts with clear separation from data processing.
 *
 * @module lib/portfolio-analytics
 */

import {
  Activity,
  BarChart3,
  Clock,
  PieChart,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import type {
  AnalyticsMetric,
  ChartPeriod,
  PerformancePeriod,
  PortfolioDataPoint,
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
// Mock data generation functions removed in Phase 1 cleanup
// TODO: Replace with real API data when endpoints are available

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

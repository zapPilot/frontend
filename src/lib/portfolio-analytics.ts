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
  PortfolioDataPoint,
} from "../types/portfolio";
import type { ActualRiskSummaryResponse } from "../types/risk";
import { getVolatilityLevel } from "../utils/risk";
import {
  formatDrawdown,
  formatSharpeRatio,
  formatVolatility,
} from "./formatters";

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

/**
 * Generate analytics metrics with real risk data
 *
 * @param riskData - Real risk data from API (required)
 * @returns Array of analytics metrics with real data or N/A placeholders
 */
export function getAnalyticsMetrics(
  riskData: ActualRiskSummaryResponse
): AnalyticsMetric[] {
  // Extract risk metrics from real data
  const sharpeRatio =
    riskData.risk_summary?.sharpe_ratio?.sharpe_ratio ||
    riskData.summary_metrics?.sharpe_ratio;
  const volatilityPct =
    riskData.summary_metrics?.annualized_volatility_percentage;
  const drawdownPct = riskData.summary_metrics?.max_drawdown_percentage;
  return [
    createPlaceholderMetric(
      "Total Return",
      TrendingUp,
      "All-time portfolio performance (pending data source)"
    ),
    createPlaceholderMetric(
      "Annualized Return",
      BarChart3,
      "Year-over-year performance (pending data source)"
    ),
    buildRiskMetric(volatilityPct),
    buildSharpeMetric(sharpeRatio),
    buildDrawdownMetric(drawdownPct),
    buildVolatilityMetric(volatilityPct),
    createPlaceholderMetric(
      "Active Positions",
      PieChart,
      "Currently held assets (pending data source)"
    ),
    createPlaceholderMetric(
      "Days Invested",
      Clock,
      "Portfolio age (pending data source)"
    ),
  ];
}

function createPlaceholderMetric(
  label: string,
  icon: AnalyticsMetric["icon"],
  description: string
): AnalyticsMetric {
  return {
    label,
    value: "N/A",
    change: 0,
    trend: "neutral",
    icon,
    description,
  };
}

function buildRiskMetric(volatilityPct?: number): AnalyticsMetric {
  const normalized =
    typeof volatilityPct === "number" ? volatilityPct : undefined;
  const derivedTrend =
    normalized !== undefined ? (normalized > 50 ? "down" : "up") : "neutral";
  const derivedChange =
    normalized !== undefined ? (normalized > 50 ? -0.5 : 0.2) : 0;

  return {
    label: "Risk Level",
    value: normalized !== undefined ? getVolatilityLevel(normalized) : "N/A",
    change: derivedChange,
    trend: derivedTrend,
    icon: Shield,
    description: "Risk level based on volatility analysis",
  };
}

function buildSharpeMetric(sharpeRatio?: number): AnalyticsMetric {
  const normalized = typeof sharpeRatio === "number" ? sharpeRatio : undefined;
  const derivedTrend =
    normalized !== undefined ? (normalized > 1.5 ? "up" : "down") : "neutral";
  const derivedChange =
    normalized !== undefined ? (normalized > 1.5 ? 0.15 : -0.05) : 0;

  return {
    label: "Sharpe Ratio",
    value: normalized !== undefined ? formatSharpeRatio(normalized) : "N/A",
    change: derivedChange,
    trend: derivedTrend,
    icon: Target,
    description: "Risk-adjusted returns",
  };
}

function buildDrawdownMetric(drawdownPct?: number): AnalyticsMetric {
  const normalized = typeof drawdownPct === "number" ? drawdownPct : undefined;
  const formattedValue =
    normalized !== undefined ? formatDrawdown(normalized) : "N/A";
  const change = normalized !== undefined ? Math.abs(normalized) * 0.1 : 0;

  return {
    label: "Max Drawdown",
    value: formattedValue,
    change,
    trend: normalized !== undefined ? "down" : "neutral",
    icon: TrendingDown,
    description: "Largest peak-to-trough portfolio decline",
  };
}

function buildVolatilityMetric(volatilityPct?: number): AnalyticsMetric {
  const normalized =
    typeof volatilityPct === "number" ? volatilityPct : undefined;
  const trend =
    normalized !== undefined ? (normalized > 50 ? "down" : "up") : "neutral";
  const change =
    normalized !== undefined ? (normalized > 100 ? -2.0 : -0.5) : 0;

  return {
    label: "Volatility",
    value: normalized !== undefined ? formatVolatility(normalized) : "N/A",
    change,
    trend,
    icon: Activity,
    description: "Annualized portfolio volatility",
  };
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
): { date: string; drawdown: number }[] {
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

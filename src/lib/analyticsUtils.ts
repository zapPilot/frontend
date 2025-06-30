// Analytics Utilities
// Helper functions for analytics dashboard components

import {
  TrendingUp,
  DollarSign,
  Target,
  Shield,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import {
  AnalyticsMetric,
  PerformancePeriod,
  AssetAttribution,
} from "../types/analytics";

// Color utilities for performance indicators
export function getChangeColor(change: number): string {
  if (change > 0) return "text-green-400";
  if (change < 0) return "text-red-400";
  return "text-gray-400";
}

export function getPerformanceColor(performance: number): string {
  if (performance > 0) return "text-green-400";
  if (performance < 0) return "text-red-400";
  return "text-gray-400";
}

// Mock data generators (replace with actual API calls)
export function getAnalyticsMetrics(): AnalyticsMetric[] {
  return [
    {
      label: "Total Return",
      value: "24.3%",
      change: 2.4,
      icon: TrendingUp,
    },
    {
      label: "Portfolio Value",
      value: "$127.8K",
      change: 5.2,
      icon: DollarSign,
    },
    {
      label: "Sharpe Ratio",
      value: "1.84",
      change: 0.3,
      icon: Target,
    },
    {
      label: "Max Drawdown",
      value: "-8.2%",
      change: -1.1,
      icon: Shield,
    },
    {
      label: "Win Rate",
      value: "68.4%",
      change: 3.7,
      icon: BarChart3,
    },
    {
      label: "Alpha",
      value: "12.8%",
      change: 1.9,
      icon: ArrowUpRight,
    },
  ];
}

export function getPerformanceData(): PerformancePeriod[] {
  return [
    {
      period: "1D",
      return: 1.2,
      volatility: 15.3,
      sharpe: 1.84,
      maxDrawdown: -2.1,
    },
    {
      period: "1W",
      return: 3.8,
      volatility: 18.7,
      sharpe: 1.92,
      maxDrawdown: -3.4,
    },
    {
      period: "1M",
      return: 8.9,
      volatility: 22.1,
      sharpe: 1.76,
      maxDrawdown: -5.8,
    },
    {
      period: "3M",
      return: 18.4,
      volatility: 28.9,
      sharpe: 1.68,
      maxDrawdown: -8.2,
    },
    {
      period: "6M",
      return: 24.3,
      volatility: 31.2,
      sharpe: 1.54,
      maxDrawdown: -12.7,
    },
    {
      period: "1Y",
      return: 47.2,
      volatility: 35.8,
      sharpe: 1.41,
      maxDrawdown: -18.9,
    },
  ];
}

export function generateAssetAttribution(): AssetAttribution[] {
  return [
    {
      asset: "BTC",
      allocation: 35.2,
      performance: 21.4,
      risk: "Medium",
    },
    {
      asset: "ETH",
      allocation: 28.7,
      performance: 18.9,
      risk: "Medium",
    },
    {
      asset: "Stablecoins",
      allocation: 20.1,
      performance: 4.2,
      risk: "Low",
    },
    {
      asset: "DeFi Tokens",
      allocation: 12.4,
      performance: 45.7,
      risk: "High",
    },
    {
      asset: "Altcoins",
      allocation: 3.6,
      performance: -8.3,
      risk: "High",
    },
  ];
}

// Format utilities
export function formatPercentage(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

// Risk level utilities
export function getRiskColor(risk: string): string {
  switch (risk.toLowerCase()) {
    case "low":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "high":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export function getRiskBadgeClass(risk: string): string {
  switch (risk.toLowerCase()) {
    case "low":
      return "bg-green-900/30 text-green-400 border-green-800";
    case "medium":
      return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
    case "high":
      return "bg-red-900/30 text-red-400 border-red-800";
    default:
      return "bg-gray-900/30 text-gray-400 border-gray-800";
  }
}

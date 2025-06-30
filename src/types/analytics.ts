// Analytics Types
// Type definitions for analytics dashboard components

import { LucideIcon } from "lucide-react";

export interface AnalyticsMetric {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
}

export interface PerformancePeriod {
  period: string;
  return: number;
  volatility: number;
  sharpe: number;
  maxDrawdown: number;
}

export interface AssetAttribution {
  asset: string;
  allocation: number;
  performance: number;
  risk: "Low" | "Medium" | "High";
}

export interface AnalyticsData {
  metrics: AnalyticsMetric[];
  performancePeriods: PerformancePeriod[];
  assetAttribution: AssetAttribution[];
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PerformanceChartData {
  data: ChartDataPoint[];
  timeframe: string;
  isPositive: boolean;
  totalReturn: number;
}

// Risk assessment types
export type RiskLevel = "Low" | "Medium" | "High";

export interface RiskMetrics {
  level: RiskLevel;
  score: number;
  factors: string[];
  recommendation: string;
}

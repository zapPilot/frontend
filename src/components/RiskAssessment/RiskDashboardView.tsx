/**
 * Risk Dashboard View - Variation 3
 *
 * High information density dashboard-style layout for power users
 * Features interactive charts, gauges, and comprehensive risk overview
 */

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Target,
  Activity,
  BarChart3,
} from "lucide-react";
import { ActualRiskSummaryResponse } from "../../types/risk";
import { GlassCard } from "../ui";

interface RiskDashboardViewProps {
  data: ActualRiskSummaryResponse;
  className?: string;
}

/**
 * Circular Progress Component for gauges
 */
function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = "#8b5cf6",
  backgroundColor = "#374151",
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {value.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini Spark Line Chart Component
 */
function SparkLine({
  data,
  width = 100,
  height = 30,
  color = "#ef4444",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        className="opacity-80"
      />
      {/* Add a subtle glow effect */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1"
        className="opacity-40 blur-sm"
      />
    </svg>
  );
}

export function RiskDashboardView({
  data,
  className = "",
}: RiskDashboardViewProps) {
  const { summary_metrics, risk_summary } = data;
  const volatilityPct = summary_metrics.annualized_volatility_percentage;
  const drawdownPct = Math.abs(summary_metrics.max_drawdown_percentage);

  // Create mock time series data for drawdown visualization
  // In a real implementation, this would come from the API
  const mockDrawdownSeries = Array.from({ length: 12 }, (_, i) => {
    const variation = Math.sin(i * 0.5) * 5;
    return Math.max(0, drawdownPct + variation);
  });

  // Calculate days to recovery (mock calculation)
  const averageRecoveryDays =
    risk_summary.drawdown.recovery_needed_percentage > 0
      ? Math.round(risk_summary.drawdown.recovery_needed_percentage * 2.5)
      : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">
          Risk Dashboard Overview
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center">
            <Activity className="w-4 h-4 mr-1" />
            Live Analysis
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Volatility Gauge - Top Left */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-1 xl:col-span-2"
        >
          <GlassCard className="p-6 h-full bg-purple-900/20 border border-purple-800/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                Annualized Volatility
              </h4>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  volatilityPct > 100
                    ? "bg-red-900/30 text-red-400"
                    : volatilityPct > 50
                      ? "bg-orange-900/30 text-orange-400"
                      : "bg-yellow-900/30 text-yellow-400"
                }`}
              >
                {volatilityPct > 100
                  ? "EXTREME"
                  : volatilityPct > 50
                    ? "HIGH"
                    : "MODERATE"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {volatilityPct.toFixed(1)}%
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Daily Vol.</span>
                    <span className="text-gray-300">
                      {(risk_summary.volatility.volatility_daily * 100).toFixed(
                        2
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg. Daily Return</span>
                    <span
                      className={`${
                        risk_summary.volatility.average_daily_return >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {risk_summary.volatility.average_daily_return >= 0
                        ? "+"
                        : ""}
                      {(
                        risk_summary.volatility.average_daily_return * 100
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-4">
                <CircularProgress
                  value={Math.min(volatilityPct, 200)}
                  max={200}
                  color="#8b5cf6"
                  size={100}
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Drawdown Chart - Top Right */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="lg:col-span-1 xl:col-span-2"
        >
          <GlassCard className="p-6 h-full bg-red-900/20 border border-red-800/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white flex items-center">
                <TrendingDown className="w-5 h-5 mr-2 text-red-400" />
                Maximum Drawdown
              </h4>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  drawdownPct >= 20
                    ? "bg-red-900/30 text-red-400"
                    : drawdownPct >= 10
                      ? "bg-orange-900/30 text-orange-400"
                      : "bg-yellow-900/30 text-yellow-400"
                }`}
              >
                {drawdownPct >= 20
                  ? "SEVERE"
                  : drawdownPct >= 10
                    ? "MODERATE"
                    : "LOW"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-3xl font-bold text-red-400 mb-2">
                  -{drawdownPct.toFixed(1)}%
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Peak Value</span>
                    <span className="text-green-400">
                      ${(risk_summary.drawdown.peak_value / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Trough Value</span>
                    <span className="text-red-400">
                      ${(risk_summary.drawdown.trough_value / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-4 flex flex-col items-center">
                <div className="mb-2">
                  <SparkLine
                    data={mockDrawdownSeries}
                    width={80}
                    height={40}
                    color="#ef4444"
                  />
                </div>
                <div className="text-xs text-gray-400">Drawdown Pattern</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Recovery Time - Bottom Left */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="lg:col-span-1"
        >
          <GlassCard className="p-6 h-full bg-orange-900/20 border border-orange-800/30">
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 mr-2 text-orange-400" />
              <h4 className="text-lg font-semibold text-white">
                Recovery Time
              </h4>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400 mb-2">
                {averageRecoveryDays || "—"}
              </div>
              <div className="text-sm text-gray-400 mb-3">
                {averageRecoveryDays ? "Days (Est.)" : "Fully Recovered"}
              </div>

              {risk_summary.drawdown.recovery_needed_percentage > 0 && (
                <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(risk_summary.drawdown.recovery_needed_percentage * 3, 100)}%`,
                    }}
                  />
                </div>
              )}

              <div className="text-xs text-gray-500">
                {risk_summary.drawdown.recovery_needed_percentage > 0
                  ? `+${risk_summary.drawdown.recovery_needed_percentage.toFixed(1)}% needed`
                  : "Above peak value"}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Analysis Context - Bottom Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="lg:col-span-1"
        >
          <GlassCard className="p-6 h-full bg-blue-900/20 border border-blue-800/30">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
              <h4 className="text-lg font-semibold text-white">
                Analysis Context
              </h4>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Period</span>
                <span className="text-sm text-white font-medium">
                  {risk_summary.volatility.period_days}d
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Data Points</span>
                <span className="text-sm text-white font-medium">
                  {risk_summary.volatility.data_points}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Confidence</span>
                <span className="text-green-400 text-sm font-medium">High</span>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-400">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Risk Composition - Full Width Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="lg:col-span-2 xl:col-span-4"
        >
          <GlassCard className="p-6 bg-gray-900/20 border border-gray-800/30">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-white flex items-center">
                <Target className="w-5 h-5 mr-2 text-gray-400" />
                Risk Profile Summary
              </h4>
              <div className="text-sm text-gray-400">
                Comprehensive Risk Assessment
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Risk Level Indicator */}
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">
                  Overall Risk Level
                </div>
                <div
                  className={`text-lg font-bold mb-2 ${
                    volatilityPct > 100 && drawdownPct > 15
                      ? "text-red-400"
                      : volatilityPct > 50 || drawdownPct > 10
                        ? "text-orange-400"
                        : "text-yellow-400"
                  }`}
                >
                  {volatilityPct > 100 && drawdownPct > 15
                    ? "Very High"
                    : volatilityPct > 50 || drawdownPct > 10
                      ? "High"
                      : "Moderate"}
                </div>
                <div className="text-xs text-gray-500">
                  Based on volatility and drawdown analysis
                </div>
              </div>

              {/* Key Metrics */}
              <div>
                <div className="text-sm text-gray-400 mb-3">
                  Key Risk Metrics
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Volatility Risk
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-gray-800 rounded-full h-1">
                        <div
                          className="bg-purple-500 h-1 rounded-full"
                          style={{
                            width: `${Math.min(volatilityPct / 2, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-purple-400 w-8 text-right">
                        {Math.min(Math.round(volatilityPct / 2), 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Drawdown Risk</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-gray-800 rounded-full h-1">
                        <div
                          className="bg-red-500 h-1 rounded-full"
                          style={{
                            width: `${Math.min(drawdownPct * 5, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-red-400 w-8 text-right">
                        {Math.min(Math.round(drawdownPct * 5), 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Items */}
              <div>
                <div className="text-sm text-gray-400 mb-3">Action Items</div>
                <div className="space-y-1">
                  {volatilityPct > 100 && (
                    <div className="text-xs text-yellow-300">
                      • Consider position sizing
                    </div>
                  )}
                  {drawdownPct > 15 && (
                    <div className="text-xs text-yellow-300">
                      • Review stop-loss levels
                    </div>
                  )}
                  <div className="text-xs text-blue-300">
                    • Monitor regularly
                  </div>
                  <div className="text-xs text-green-300">
                    • Review diversification
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

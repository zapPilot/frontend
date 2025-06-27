"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  Shield,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import { memo, useMemo } from "react";
import { GlassCard } from "../ui";

interface AnalyticsMetric {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface PerformancePeriod {
  period: string;
  return: number;
  volatility: number;
  sharpe: number;
  maxDrawdown: number;
}

const AnalyticsDashboardComponent = () => {
  // Mock analytics data - in real app this would come from API
  const portfolioMetrics: AnalyticsMetric[] = useMemo(
    () => [
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
        value: "1.34",
        change: 0.15,
        trend: "up",
        icon: Target,
        description: "Risk-adjusted returns",
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
    ],
    []
  );

  const performanceData: PerformancePeriod[] = useMemo(
    () => [
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
        sharpe: 0.67,
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
    ],
    []
  );

  const allocationData = useMemo(
    () => [
      { asset: "BTC", allocation: 35.2, performance: 21.4, risk: "Medium" },
      { asset: "ETH", allocation: 28.7, performance: 18.9, risk: "Medium" },
      { asset: "Stablecoins", allocation: 20.1, performance: 4.2, risk: "Low" },
      {
        asset: "DeFi Tokens",
        allocation: 12.4,
        performance: 45.7,
        risk: "High",
      },
      { asset: "Altcoins", allocation: 3.6, performance: -8.3, risk: "High" },
    ],
    []
  );

  const getChangeColor = (trend: string) => {
    if (trend === "neutral") return "text-gray-400";
    if (trend === "up") return "text-green-400";
    return "text-red-400";
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return "text-green-400";
    if (value < 0) return "text-red-400";
    return "text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold gradient-text mb-2">
          Portfolio Analytics
        </h2>
        <p className="text-gray-400">
          Advanced metrics and performance insights
        </p>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
            Key Metrics
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {portfolioMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 glass-morphism rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Icon className="w-5 h-5 text-purple-400" />
                    <div
                      className={`flex items-center text-xs ${getChangeColor(metric.trend)}`}
                    >
                      {metric.trend === "up" && (
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                      )}
                      {metric.trend === "down" && (
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                      )}
                      {metric.change !== 0 &&
                        `${metric.change > 0 ? "+" : ""}${metric.change}%`}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-white mb-1">
                    {metric.value}
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    {metric.label}
                  </div>
                  {metric.description && (
                    <div className="text-xs text-gray-500">
                      {metric.description}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Performance Periods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            Performance by Period
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 text-sm font-medium text-gray-400">
                    Period
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">
                    Return
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">
                    Volatility
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">
                    Sharpe
                  </th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">
                    Max DD
                  </th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((period, index) => (
                  <motion.tr
                    key={period.period}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="border-b border-gray-800/50 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 text-sm font-medium text-white">
                      {period.period}
                    </td>
                    <td
                      className={`py-3 text-sm text-right font-medium ${getPerformanceColor(period.return)}`}
                    >
                      {period.return > 0 ? "+" : ""}
                      {period.return.toFixed(2)}%
                    </td>
                    <td className="py-3 text-sm text-right text-gray-300">
                      {period.volatility.toFixed(1)}%
                    </td>
                    <td
                      className={`py-3 text-sm text-right font-medium ${period.sharpe > 1 ? "text-green-400" : period.sharpe > 0.5 ? "text-yellow-400" : "text-red-400"}`}
                    >
                      {period.sharpe.toFixed(2)}
                    </td>
                    <td className="py-3 text-sm text-right text-red-400 font-medium">
                      {period.maxDrawdown.toFixed(1)}%
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>

      {/* Asset Allocation Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-blue-400" />
            Asset Allocation Analysis
          </h3>
          <div className="space-y-3">
            {allocationData.map((asset, index) => (
              <motion.div
                key={asset.asset}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="flex items-center justify-between p-3 glass-morphism rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-white min-w-[80px]">
                    {asset.asset}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                        style={{ width: `${asset.allocation * 2.5}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 min-w-[40px]">
                      {asset.allocation.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div
                    className={`text-sm font-medium ${getPerformanceColor(asset.performance)}`}
                  >
                    {asset.performance > 0 ? "+" : ""}
                    {asset.performance.toFixed(1)}%
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs ${
                      asset.risk === "Low"
                        ? "bg-green-900/30 text-green-400"
                        : asset.risk === "Medium"
                          ? "bg-yellow-900/30 text-yellow-400"
                          : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    {asset.risk}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Risk Assessment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
            Risk Assessment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 glass-morphism rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  Concentration Risk
                </span>
                <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded-full">
                  Medium
                </span>
              </div>
              <div className="text-lg font-bold text-white mb-1">63.9%</div>
              <div className="text-xs text-gray-500">Top 2 assets exposure</div>
            </div>

            <div className="p-4 glass-morphism rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Correlation Risk</span>
                <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded-full">
                  High
                </span>
              </div>
              <div className="text-lg font-bold text-white mb-1">0.82</div>
              <div className="text-xs text-gray-500">
                Average asset correlation
              </div>
            </div>

            <div className="p-4 glass-morphism rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Liquidity Risk</span>
                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full">
                  Low
                </span>
              </div>
              <div className="text-lg font-bold text-white mb-1">94.3%</div>
              <div className="text-xs text-gray-500">Liquid assets ratio</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export const AnalyticsDashboard = memo(AnalyticsDashboardComponent);

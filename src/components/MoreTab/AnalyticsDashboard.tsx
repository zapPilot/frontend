"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import { memo, useMemo } from "react";
import { GRADIENTS } from "@/constants/design-system";
import { GlassCard, APRMetrics } from "../ui";
import {
  getAnalyticsMetrics,
  getPerformanceData,
  generateAssetAttribution,
  getChangeColor,
  getPerformanceColor,
} from "../../lib/portfolioUtils";
import {
  AnalyticsMetric,
  PerformancePeriod,
  AssetAttribution,
} from "../../types/portfolio";

const AnalyticsDashboardComponent = () => {
  // Mock analytics data - in real app this would come from API
  const portfolioMetrics: AnalyticsMetric[] = useMemo(
    () => getAnalyticsMetrics(),
    []
  );
  const performanceData: PerformancePeriod[] = useMemo(
    () => getPerformanceData(),
    []
  );
  const assetAttributionData: AssetAttribution[] = useMemo(
    () => generateAssetAttribution(),
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

      {/* APR & Monthly Return Highlight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            Portfolio Performance Highlights
          </h3>
          <APRMetrics
            annualAPR={18.5}
            monthlyReturn={1.4}
            size="large"
            className="justify-center"
          />
        </GlassCard>
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
                        className={`h-full bg-gradient-to-r ${GRADIENTS.PRIMARY} rounded-full`}
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

      {/* Asset Attribution Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-400" />
            Asset Attribution Analysis
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Which assets are driving your portfolio returns this month
          </p>

          <div className="space-y-4">
            {assetAttributionData.map((item, index) => (
              <motion.div
                key={item.asset}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="p-4 glass-morphism rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {item.asset}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.allocation.toFixed(1)}% allocation
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${getPerformanceColor(item.performance)}`}
                      >
                        {item.performance > 0 ? "+" : ""}
                        {item.performance.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">performance</div>
                    </div>

                    <div className="text-right min-w-[60px]">
                      <div
                        className={`text-lg font-bold ${getPerformanceColor(item.contribution)}`}
                      >
                        {item.contribution > 0 ? "+" : ""}
                        {item.contribution.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">contribution</div>
                    </div>
                  </div>
                </div>

                {/* Contribution Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Contribution to Returns</span>
                    <span>{Math.abs(item.contribution).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.contribution >= 0 ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-red-500 to-red-400"} rounded-full transition-all duration-500`}
                      style={{
                        width: `${Math.min(Math.abs(item.contribution) * 8, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <Target className="w-4 h-4 text-blue-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-300 mb-1">
                  Top Performer: DeFi Tokens
                </div>
                <div className="text-xs text-gray-400">
                  Despite only 12.4% allocation, DeFi tokens contributed 4.1% to
                  your portfolio returns due to their strong 33.2% performance
                  this month.
                </div>
              </div>
            </div>
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

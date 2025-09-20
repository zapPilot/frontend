"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { memo, useMemo } from "react";
import { useRiskSummary } from "../../hooks/useRiskSummary";
import { getChangeColorClasses } from "../../lib/color-utils";
import {
  generateAssetAttribution,
  getAnalyticsMetrics,
} from "../../lib/portfolio-analytics";
import { AssetAttribution } from "../../types/portfolio";
import { GlassCard } from "../ui";
import { KeyMetricsGrid } from "./components";

interface AnalyticsDashboardProps {
  userId?: string | undefined;
}

const AnalyticsDashboardComponent = ({ userId }: AnalyticsDashboardProps) => {
  // Fetch real risk data for Key Metrics Grid
  const { data: riskData } = useRiskSummary(userId || "");

  // Generate analytics metrics with real risk data
  const portfolioMetrics = useMemo(
    () => getAnalyticsMetrics(riskData || undefined),
    [riskData]
  );
  const assetAttributionData: AssetAttribution[] = useMemo(
    () => generateAssetAttribution(),
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
      {/* Key Metrics Grid - Now with real risk data */}
      <KeyMetricsGrid metrics={portfolioMetrics} />
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
                        className={`text-sm font-medium ${getChangeColorClasses(item.performance)}`}
                      >
                        {item.performance > 0 ? "+" : ""}
                        {item.performance.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">performance</div>
                    </div>

                    <div className="text-right min-w-[60px]">
                      <div
                        className={`text-lg font-bold ${getChangeColorClasses(item.contribution)}`}
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
    </div>
  );
};

export const AnalyticsDashboard = memo(AnalyticsDashboardComponent);

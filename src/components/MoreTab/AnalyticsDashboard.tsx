"use client";

import { motion } from "framer-motion";
import { memo, useMemo } from "react";
import { useRiskSummary } from "../../hooks/useRiskSummary";
import { getAnalyticsMetrics } from "../../lib/portfolio-analytics";
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
      {/* TODO: Asset Attribution Analysis - Replace with real API data when asset attribution endpoint is available */}
    </div>
  );
};

export const AnalyticsDashboard = memo(AnalyticsDashboardComponent);

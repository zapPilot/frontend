"use client";

import { motion } from "framer-motion";
import { memo, useMemo } from "react";

import { MetricsSkeleton } from "@/components/ui/LoadingSystem";

import { useRiskSummary } from "../../hooks/useRiskSummary";
import { getAnalyticsMetrics } from "../../lib/portfolio-analytics";
import { KeyMetricsGrid } from "./components";

interface AnalyticsDashboardProps {
  userId?: string | undefined;
}

const AnalyticsDashboardComponent = ({ userId }: AnalyticsDashboardProps) => {
  // Fetch real risk data for Key Metrics Grid
  const { data: riskData, isLoading, error } = useRiskSummary(userId ?? "");

  // Generate analytics metrics with real risk data (only when data is available)
  const portfolioMetrics = useMemo(
    () => (riskData ? getAnalyticsMetrics(riskData) : []),
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
      {isLoading && <MetricsSkeleton className="py-8" />}
      {error && (
        <div className="text-center py-8">
          <div className="text-red-400 font-semibold mb-2">
            Failed to load analytics data
          </div>
          <p className="text-sm text-gray-400">
            {error.message || "Please try again later"}
          </p>
        </div>
      )}
      {!isLoading && !error && riskData && portfolioMetrics.length > 0 && (
        <KeyMetricsGrid metrics={portfolioMetrics} />
      )}
      {!isLoading && !error && riskData && portfolioMetrics.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No metrics available. This may happen for new portfolios with
          insufficient transaction history.
        </div>
      )}
      {/* ZAP-208: Asset Attribution Analysis - pending asset attribution API endpoint */}
    </div>
  );
};

export const AnalyticsDashboard = memo(AnalyticsDashboardComponent);

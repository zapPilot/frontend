"use client";

import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import { usePortfolioAPR } from "../hooks/queries/useAPRQuery";
import { AnalyticsDashboard } from "./MoreTab/index";
import { PoolPerformanceTable } from "./PoolAnalytics";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "./ui/LoadingSpinner";

// Dynamic import for heavy chart component
const PortfolioChart = dynamic(
  () =>
    import("./PortfolioChart").then(mod => ({ default: mod.PortfolioChart })),
  {
    loading: () => (
      <div className="glass-morphism rounded-3xl p-6 border border-gray-800 flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-400">Loading Chart...</span>
      </div>
    ),
  }
);

export function AnalyticsTab() {
  // Get user data for pool analytics
  const { userInfo } = useUser();

  // Fetch pool analytics data
  const {
    poolDetails,
    isLoading: poolLoading,
    error: poolError,
    refetch: poolRefetch,
  } = usePortfolioAPR(userInfo?.userId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Portfolio Analytics
        </h1>
        <p className="text-gray-400">
          Advanced metrics and historical performance analysis
        </p>
      </motion.div>

      {/* Historical Performance Chart */}
      <PortfolioChart />

      {/* Pool Performance Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <PoolPerformanceTable
          pools={poolDetails || []}
          isLoading={poolLoading}
          error={poolError}
          onRetry={poolRefetch}
        />
      </motion.div>

      {/* Portfolio Analytics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <AnalyticsDashboard />
      </motion.div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { AnalyticsDashboard } from "./MoreTab/index";
import { EnhancedPortfolioChart } from "./EnhancedPortfolioChart";

export function AnalyticsTab() {
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
      <EnhancedPortfolioChart />

      {/* Portfolio Analytics Dashboard */}
      <AnalyticsDashboard />
    </div>
  );
}

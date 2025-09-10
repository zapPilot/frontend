/**
 * Key Metrics Grid Component
 *
 * Displays portfolio key metrics in a responsive grid layout
 * Extracted from AnalyticsDashboard for better modularity
 */

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { GlassCard } from "../../ui";
import { KeyMetricCard, KeyMetricCardData } from "./KeyMetricCard";

interface KeyMetricsGridProps {
  metrics: KeyMetricCardData[];
  className?: string;
}

export function KeyMetricsGrid({
  metrics,
  className = "",
}: KeyMetricsGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={className}
    >
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
          Key Metrics
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <KeyMetricCard key={metric.label} metric={metric} index={index} />
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

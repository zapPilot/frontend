/**
 * Key Metric Card Component
 *
 * Reusable component for displaying individual metrics in the Key Metrics Grid
 * Supports trends, changes, icons, and descriptions
 */

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { scaleIn, SMOOTH_TRANSITION } from "@/lib/animationVariants";

import { getChangeColorClasses } from "../../../lib/color-utils";
import type { AnalyticsMetric } from "../../../types/portfolio";

export type KeyMetricCardData = AnalyticsMetric;

interface KeyMetricCardProps {
  metric: KeyMetricCardData;
  index: number;
}

export function KeyMetricCard({ metric, index }: KeyMetricCardProps) {
  const Icon = metric.icon;

  return (
    <motion.div
      {...scaleIn}
      transition={{ ...SMOOTH_TRANSITION, delay: index * 0.05 }}
      className="p-4 glass-morphism rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-2">
        <Icon className="w-5 h-5 text-purple-400" />
        <div
          className={`flex items-center text-xs ${getChangeColorClasses(
            metric.trend === "up" ? 1 : metric.trend === "down" ? -1 : 0
          )}`}
        >
          {metric.trend === "up" && <ArrowUpRight className="w-3 h-3 mr-1" />}
          {metric.trend === "down" && (
            <ArrowDownRight className="w-3 h-3 mr-1" />
          )}
          {metric.change !== 0 &&
            `${metric.change > 0 ? "+" : ""}${metric.change}%`}
        </div>
      </div>
      <div className="text-xl font-bold text-white mb-1">{metric.value}</div>
      <div className="text-xs text-gray-400 mb-1">{metric.label}</div>
      {metric.description && (
        <div className="text-xs text-gray-500">{metric.description}</div>
      )}
    </motion.div>
  );
}

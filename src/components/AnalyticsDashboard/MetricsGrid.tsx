"use client";

import { BarChart3 } from "lucide-react";
import { GlassCard } from "../ui";
import { AnalyticsMetric } from "../../types/analytics";
import { getChangeColor } from "../../lib/analyticsUtils";

interface MetricsGridProps {
  metrics: AnalyticsMetric[];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
        Key Metrics
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="bg-gray-900/30 rounded-lg p-4 text-center border border-gray-800/50"
            >
              <div className="flex justify-center mb-2">
                <Icon className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-400 mb-1">{metric.label}</div>
              <div
                className={`text-xs font-medium ${getChangeColor(
                  metric.change
                )}`}
              >
                {metric.change > 0 ? "+" : ""}
                {metric.change.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

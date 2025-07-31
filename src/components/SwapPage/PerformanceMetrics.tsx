"use client";

import { TrendingUp } from "lucide-react";
import { PERFORMANCE_MOCK_DATA } from "../../constants/trading";

export function PerformanceMetrics() {
  return (
    <div
      className="glass-morphism rounded-3xl p-6 border border-gray-800"
      data-testid="performance-metrics"
    >
      <h3 className="text-xl font-bold gradient-text mb-6">
        Performance Metrics
      </h3>
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        data-testid="performance-grid"
      >
        {PERFORMANCE_MOCK_DATA.map(stat => (
          <div
            key={stat.period}
            className="p-5 rounded-2xl bg-gray-900/30 border border-gray-700/50"
            data-testid={`performance-${stat.period.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">{stat.period}</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div
              className={`text-2xl font-bold ${stat.color} mb-1`}
              data-testid={`change-${stat.period.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {stat.change}
            </div>
            <div className="text-sm text-gray-500">{stat.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

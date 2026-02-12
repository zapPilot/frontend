"use client";

import { MetricsSkeleton } from "@/components/ui";

export function BacktestLoadingState() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Running backtest simulation"
    >
      {/* Metrics skeleton (matches BacktestMetrics 3-column layout) */}
      <MetricsSkeleton />

      {/* Chart skeleton */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Performance Chart
        </h4>
        <div className="h-80 w-full bg-gray-800/50 rounded-xl animate-pulse" />
      </div>

      <span className="sr-only">Loading backtest results...</span>
    </div>
  );
}

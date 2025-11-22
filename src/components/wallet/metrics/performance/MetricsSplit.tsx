import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";

import { ConsolidatedMetricV1 as ConsolidatedMetric } from "../consolidated/ConsolidatedMetricV1";
import type { PerformanceMetricsProps } from "./types";

export function MetricsSplit({
  portfolioROI,
  yieldSummaryData,
  isLandingLoading,
  isYieldLoading,
  shouldShowLoading,
  portfolioChangePercentage,
  className = "",
}: PerformanceMetricsProps) {
  const isLoading = shouldShowLoading || isLandingLoading || isYieldLoading;

  if (isLoading) {
    return (
      <div className={`flex gap-4 ${className}`}>
        <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <WalletMetricsSkeleton />
        </div>
        <div className="w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent" />
        <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <WalletMetricsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 ${className}`}>
      {/* Left Panel - Quick Stats */}
      <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
          Performance Windows
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-800/50">
            <span className="text-sm text-gray-400">7 Day ROI</span>
            <span className="text-sm font-semibold text-gray-200">
              {((portfolioROI?.roi_7d?.value ?? 0) / 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-800/50">
            <span className="text-sm text-gray-400">30 Day ROI</span>
            <span className="text-sm font-semibold text-gray-200">
              {((portfolioROI?.roi_30d?.value ?? 0) / 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">365 Day ROI</span>
            <span className="text-sm font-semibold text-gray-200">
              {((portfolioROI?.roi_365d?.value ?? 0) / 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Vertical Separator */}
      <div className="w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent" />

      {/* Right Panel - Consolidated Metric */}
      <div className="flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6 flex items-center justify-center">
        <ConsolidatedMetric
          portfolioROI={portfolioROI}
          yieldSummaryData={yieldSummaryData}
          portfolioChangePercentage={portfolioChangePercentage}
        />
      </div>
    </div>
  );
}

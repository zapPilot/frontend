import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";

import { ConsolidatedMetricV1 as ConsolidatedMetric } from "../consolidated/ConsolidatedMetricV1";
import type { PerformanceMetricsProps } from "./types";

export function MetricsCard({
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
      <div className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-xl p-8 ${className}`}>
        <WalletMetricsSkeleton />
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-xl p-8 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
          Portfolio Performance
        </h3>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
      </div>
      
      <ConsolidatedMetric
        portfolioROI={portfolioROI}
        yieldSummaryData={yieldSummaryData}
        portfolioChangePercentage={portfolioChangePercentage}
      />

      <div className="mt-6 pt-6 border-t border-gray-700/50">
        <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
          <div>
            <div className="font-medium text-gray-400">7d ROI</div>
            <div className="mt-1">{((portfolioROI?.roi_7d?.value ?? 0) / 100).toFixed(2)}%</div>
          </div>
          <div>
            <div className="font-medium text-gray-400">30d ROI</div>
            <div className="mt-1">{((portfolioROI?.roi_30d?.value ?? 0) / 100).toFixed(2)}%</div>
          </div>
          <div>
            <div className="font-medium text-gray-400">365d ROI</div>
            <div className="mt-1">{((portfolioROI?.roi_365d?.value ?? 0) / 100).toFixed(2)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

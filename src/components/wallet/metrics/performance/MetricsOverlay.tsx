import { WalletMetricsSkeleton } from "@/components/ui/LoadingSystem";

import { ConsolidatedMetricV1 as ConsolidatedMetric } from "../consolidated/ConsolidatedMetricV1";
import type { PerformanceMetricsProps } from "./types";

export function MetricsOverlay({
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
      <div className={`relative min-h-[300px] ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50 rounded-lg" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <WalletMetricsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-[300px] ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50 rounded-lg overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Floating Metric Card */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl transform transition-transform hover:scale-105">
          <ConsolidatedMetric
            portfolioROI={portfolioROI}
            yieldSummaryData={yieldSummaryData}
            portfolioChangePercentage={portfolioChangePercentage}
          />
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-4 left-4 right-4 bg-gray-900/60 backdrop-blur-sm border border-gray-700/30 rounded-lg px-4 py-2">
        <div className="flex justify-around text-xs text-gray-400">
          <div>
            <span className="text-gray-500">7d:</span>{" "}
            <span className="text-gray-300">{((portfolioROI?.roi_7d?.value ?? 0) / 100).toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-gray-500">30d:</span>{" "}
            <span className="text-gray-300">{((portfolioROI?.roi_30d?.value ?? 0) / 100).toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-gray-500">365d:</span>{" "}
            <span className="text-gray-300">{((portfolioROI?.roi_365d?.value ?? 0) / 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

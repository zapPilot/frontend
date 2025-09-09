/**
 * Risk Assessment Component
 *
 * Main container component that fetches and displays comprehensive portfolio risk analysis
 * using the narrative educational approach for mobile-first user experience
 */

"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRiskSummary } from "../../hooks/useRiskSummary";
import { RiskCardSkeletonGrid } from "./RiskCardSkeleton";
import { RiskNarrativeView } from "./RiskNarrativeView";

interface RiskAssessmentProps {
  userId: string;
  className?: string;
}

export function RiskAssessment({
  userId,
  className = "",
}: RiskAssessmentProps) {
  const { data, isLoading, error, refetch } = useRiskSummary(userId);

  // Don't render if no userId provided
  if (!userId) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={className}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3 text-orange-400" />
            Risk Assessment
          </h2>

          {/* Refresh button for manual refetch */}
          {!isLoading && (
            <button
              onClick={refetch}
              className="p-2 rounded-lg glass-morphism hover:bg-white/10 transition-colors"
              aria-label="Refresh risk data"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <RiskCardSkeletonGrid />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 glass-morphism rounded-xl animate-pulse" />
              <div className="h-96 glass-morphism rounded-xl animate-pulse" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-6 bg-red-900/20 border border-red-800/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium text-red-300 mb-2">
                  Failed to load risk assessment
                </div>
                <div className="text-sm text-gray-400">{error.message}</div>
              </div>
              <button
                onClick={refetch}
                className="px-4 py-2 text-sm bg-red-800/30 text-red-300 rounded-lg hover:bg-red-800/50 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Success State with Data */}
        {data && !isLoading && !error && (
          <div className="space-y-6">
            <RiskNarrativeView data={data} />
          </div>
        )}

        {/* Empty/Invalid Data State */}
        {data &&
          !isLoading &&
          !error &&
          (!data.risk_summary || !data.summary_metrics) && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                Insufficient Risk Data
              </h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Risk analysis requires sufficient portfolio data. Please ensure
                your portfolio has been active for at least 30 days with regular
                transactions.
              </p>
              <button
                onClick={refetch}
                className="mt-4 px-4 py-2 text-sm bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-800/70 transition-colors"
              >
                Check Again
              </button>
            </div>
          )}
      </div>
    </motion.div>
  );
}

export default RiskAssessment;

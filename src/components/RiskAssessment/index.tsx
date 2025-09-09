/**
 * Risk Assessment Component
 *
 * Main container component that fetches and displays comprehensive portfolio risk analysis
 * including annualized volatility and maximum drawdown with multiple layout variations
 */

"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Grid3x3,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useRiskSummary } from "../../hooks/useRiskSummary";
import { RiskCardSkeletonGrid } from "./RiskCardSkeleton";
import { RiskComparisonView } from "./RiskComparisonView";
import { RiskDashboardView } from "./RiskDashboardView";
import { RiskNarrativeView } from "./RiskNarrativeView";

interface RiskAssessmentProps {
  userId: string;
  className?: string;
}

type ViewVariation = "comparison" | "narrative" | "dashboard";

const viewOptions = [
  {
    key: "comparison" as ViewVariation,
    label: "Compare",
    icon: BarChart3,
    description: "Side-by-side metric comparison",
  },
  {
    key: "narrative" as ViewVariation,
    label: "Learn",
    icon: BookOpen,
    description: "Educational explanations",
  },
  {
    key: "dashboard" as ViewVariation,
    label: "Overview",
    icon: Grid3x3,
    description: "Comprehensive dashboard",
  },
];

export function RiskAssessment({
  userId,
  className = "",
}: RiskAssessmentProps) {
  const { data, isLoading, error, refetch } = useRiskSummary(userId);
  const [currentView, setCurrentView] = useState<ViewVariation>("comparison");

  // Don't render if no userId provided
  if (!userId) {
    return null;
  }

  const renderCurrentView = () => {
    if (!data) return null;

    switch (currentView) {
      case "comparison":
        return <RiskComparisonView data={data} />;
      case "narrative":
        return <RiskNarrativeView data={data} />;
      case "dashboard":
        return <RiskDashboardView data={data} />;
      default:
        return <RiskComparisonView data={data} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={className}
    >
      <div className="space-y-6">
        {/* Header with View Selector */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3 text-orange-400" />
            Risk Assessment
          </h3>

          <div className="flex items-center space-x-3">
            {/* View Selector */}
            {data && !isLoading && !error && (
              <div className="flex items-center bg-gray-900/50 rounded-lg p-1">
                {viewOptions.map(option => {
                  const Icon = option.icon;
                  const isActive = currentView === option.key;

                  return (
                    <button
                      key={option.key}
                      onClick={() => setCurrentView(option.key)}
                      className={`
                        flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                        ${
                          isActive
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                        }
                      `}
                      title={option.description}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}

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
          <div className="space-y-6">{renderCurrentView()}</div>
        )}

        {/* Empty/Invalid Data State */}
        {data &&
          !isLoading &&
          !error &&
          (!data.risk_summary || !data.summary_metrics) && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-300 mb-2">
                Insufficient Risk Data
              </h4>
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

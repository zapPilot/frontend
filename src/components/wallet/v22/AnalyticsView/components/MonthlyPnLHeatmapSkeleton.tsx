/**
 * Monthly PnL Heatmap Skeleton Component
 *
 * Loading state for the monthly PnL heatmap grid
 */

import { Calendar } from "lucide-react";

import { BaseCard } from "@/components/ui/BaseCard";

/**
 * Monthly PnL Heatmap Skeleton
 *
 * Displays a skeleton loader that matches the MonthlyPnLHeatmap layout:
 * - Header with Calendar icon and title
 * - 12-column grid of monthly cells
 * - Month labels below each cell
 */
export const MonthlyPnLHeatmapSkeleton: React.FC = () => (
  <BaseCard variant="glass" className="p-6 animate-pulse">
    {/* Header with icon */}
    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-400" />
      Monthly PnL Heatmap
    </h3>

    {/* Heatmap grid skeleton */}
    <div
      className="grid grid-cols-6 sm:grid-cols-12 gap-2"
      role="status"
      aria-label="Loading monthly PnL heatmap"
    >
      {[...Array(12)].map((_, idx) => (
        <div key={idx} className="flex flex-col gap-1">
          {/* Cell skeleton */}
          <div
            className="h-12 bg-gray-800/50 rounded-md border border-gray-700/30"
            aria-hidden="true"
          />
          {/* Month label skeleton */}
          <div
            className="h-3 bg-gray-800/30 rounded w-8 mx-auto"
            aria-hidden="true"
          />
        </div>
      ))}
    </div>
  </BaseCard>
);

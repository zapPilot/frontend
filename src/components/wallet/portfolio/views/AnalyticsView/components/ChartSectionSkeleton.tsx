/**
 * Chart Section Skeleton Component
 *
 * Loading state for the chart section with tabs and time period selector
 */

import { BaseCard } from "@/components/ui/BaseCard";

/**
 * Chart Section Skeleton
 *
 * Displays a skeleton loader that matches the ChartSection layout:
 * - Chart type tabs (Performance/Drawdown)
 * - Time period selector (1M/3M/6M/1Y/ALL)
 * - Chart area placeholder
 */
export const ChartSectionSkeleton: React.FC = () => (
  <BaseCard variant="glass" className="p-1 animate-pulse">
    {/* Header with tabs and period selector */}
    <div className="p-4 border-b border-gray-800/50 flex justify-between items-center bg-gray-900/40 rounded-t-xl">
      {/* Chart tabs skeleton */}
      <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="h-8 w-24 bg-gray-700/50 rounded-md"
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Time period buttons skeleton */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-6 w-12 bg-gray-800/50 rounded-md"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>

    {/* Chart area skeleton */}
    <div className="p-4">
      <div
        className="h-64 bg-gray-800/30 rounded-xl"
        role="status"
        aria-label="Loading chart"
      />
    </div>
  </BaseCard>
);

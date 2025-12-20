/**
 * Analytics Loading Skeleton Component
 *
 * Loading state for analytics view
 */

/**
 * Analytics Loading Skeleton
 *
 * Displays a skeleton loader matching the analytics view layout
 * with animated pulse effect.
 */
export const AnalyticsLoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header skeleton */}
    <div className="h-12 bg-gray-800/30 rounded-lg w-1/3" />

    {/* Chart skeleton */}
    <div className="h-64 bg-gray-800/30 rounded-xl" />

    {/* Metrics grid skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-800/30 rounded-xl" />
      ))}
    </div>

    {/* Additional metrics skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-800/30 rounded-xl" />
      ))}
    </div>
  </div>
);

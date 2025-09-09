/**
 * Loading Skeleton for Risk Metric Cards
 *
 * Provides smooth loading experience while risk data is being fetched
 */

export function RiskCardSkeleton() {
  return (
    <div className="p-4 glass-morphism rounded-lg animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-700 rounded w-24"></div>
        <div className="h-5 bg-gray-700 rounded-full w-12"></div>
      </div>
      <div className="h-6 bg-gray-700 rounded w-16 mb-1"></div>
      <div className="h-3 bg-gray-700 rounded w-32"></div>
    </div>
  );
}

/**
 * Grid of skeleton cards for loading state
 */
export function RiskCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RiskCardSkeleton />
      <RiskCardSkeleton />
      <RiskCardSkeleton />
    </div>
  );
}

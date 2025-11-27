import { Skeleton } from "@/components/ui/LoadingSystem";

/**
 * Loading skeleton for ConsolidatedMetricV1 component
 * Matches the layout of ROI + Yearly PnL + Daily Yield metrics
 */
export function ConsolidatedMetricSkeleton() {
  return (
    <>
      {/* ROI Primary Metric */}
      <div className="flex items-center gap-2 mb-0.5">
        <Skeleton variant="text" width="140px" height="32px" />
        <Skeleton variant="circular" width="16px" height="16px" />
      </div>

      {/* Label */}
      <Skeleton variant="text" width="120px" height="14px" className="mb-4" />

      {/* Secondary Metrics Row */}
      <div className="flex items-center gap-6 text-sm">
        {/* Yearly PnL */}
        <div className="flex flex-col items-center">
          <Skeleton variant="text" width="100px" height="20px" />
          <Skeleton
            variant="text"
            width="80px"
            height="12px"
            className="mt-0.5"
          />
        </div>

        <div className="w-px h-8 bg-gray-800" />

        {/* Daily Yield */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <Skeleton variant="text" width="80px" height="20px" />
            <Skeleton variant="circular" width="12px" height="12px" />
          </div>
          <Skeleton
            variant="text"
            width="70px"
            height="12px"
            className="mt-0.5"
          />
        </div>
      </div>
    </>
  );
}

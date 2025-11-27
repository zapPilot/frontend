import { Skeleton } from "@/components/ui/LoadingSystem";

/**
 * Loading skeleton for RebalanceSection component
 * Matches the layout of allocation bars and optimize button
 */
export function RebalanceSectionSkeleton() {
  return (
    <div className="mb-6 bg-gray-900/30 rounded-xl p-4 border border-gray-800">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Allocation display */}
        <div className="flex-1 w-full">
          <div className="flex justify-between text-sm mb-2">
            <Skeleton variant="text" width="140px" height="14px" />
            <Skeleton variant="text" width="80px" height="14px" />
          </div>

          {/* Allocation bar */}
          <Skeleton variant="rounded" height="16px" className="w-full mb-2" />

          <div className="mt-2 flex justify-between">
            <Skeleton variant="text" width="80px" height="12px" />
            <Skeleton variant="text" width="120px" height="12px" />
          </div>
        </div>

        {/* Optimize button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Skeleton variant="rounded" width="120px" height="40px" />
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/LoadingSystem";

/**
 * Partial skeleton for Daily Yield section
 * Used during progressive loading when yield data is still fetching
 */
export function YieldSectionSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5">
        <Skeleton variant="text" width="80px" height="20px" />
        <Skeleton variant="circular" width="12px" height="12px" />
      </div>
      <Skeleton variant="text" width="70px" height="12px" className="mt-0.5" />
    </div>
  );
}

/**
 * Partial skeleton for ROI section (primary metric + label)
 * Used during progressive loading when ROI data is still fetching
 */
export function ROISectionSkeleton() {
  return (
    <>
      <div className="flex items-center gap-2 mb-0.5">
        <Skeleton variant="text" width="140px" height="32px" />
        <Skeleton variant="circular" width="16px" height="16px" />
      </div>
      <Skeleton variant="text" width="120px" height="14px" className="mb-4" />
    </>
  );
}

/**
 * Partial skeleton for Yearly PnL section
 * Used during progressive loading when landing page data is still fetching
 */
export function YearlyPnLSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton variant="text" width="100px" height="20px" />
      <Skeleton variant="text" width="80px" height="12px" className="mt-0.5" />
    </div>
  );
}

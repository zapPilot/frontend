import { AlertCircle, Info, Wallet } from "lucide-react";

import { BalanceSkeleton } from "@/components/ui/LoadingSystem";
import { useMetricState } from "@/hooks/useMetricState";
import { formatCurrency } from "@/lib/formatters";
import type { PoolDetail } from "@/types/pool";

import { PoolDetailsTooltip, useMetricsTooltip } from "../tooltips";
import { NoDataMetricCard } from "./common/NoDataMetricCard";

interface BalanceMetricV1Props {
  /** Total net USD balance */
  totalNetUsd?: number | null;
  /** Is the landing page data loading? */
  isLoading?: boolean;
  /** Should show loading state? (from portfolio state helpers) */
  shouldShowLoading?: boolean;
  /** Is balance hidden? */
  balanceHidden?: boolean;
  /** Should show error state? */
  shouldShowError?: boolean;
  /** Error message to display */
  errorMessage?: string | null;
  /** Should show no data message? */
  shouldShowNoDataMessage?: boolean;
  /** Function to get display total value (from portfolio state helpers) */
  getDisplayTotalValue?: () => number | null;
  /** Pool details for tooltip display */
  poolDetails?: PoolDetail[];
  /** Total number of pool positions */
  totalPositions?: number;
  /** Number of unique protocols */
  protocolsCount?: number;
  /** Number of unique chains */
  chainsCount?: number;
}

/**
 * Compact horizontal version of BalanceMetric with reduced height.
 *
 * Key changes from original:
 * - Reduced padding: p-4 instead of p-6
 * - Smaller fonts: text-xl/2xl instead of text-3xl/4xl
 * - Inline layout for label and tooltip
 * - Reduced spacing: mb-1 instead of mb-2
 *
 * @example
 * ```tsx
 * <BalanceMetricV1
 *   totalNetUsd={15000}
 *   balanceHidden={false}
 *   isLoading={false}
 *   shouldShowLoading={false}
 * />
 * ```
 */
export function BalanceMetricV1({
  totalNetUsd,
  isLoading,
  shouldShowLoading,
  balanceHidden = false,
  shouldShowError = false,
  errorMessage,
  shouldShowNoDataMessage = false,
  getDisplayTotalValue,
  poolDetails,
  totalPositions,
  protocolsCount,
  chainsCount,
}: BalanceMetricV1Props) {
  const metricState = useMetricState({
    isLoading,
    shouldShowLoading,
    value: totalNetUsd,
  });

  const poolTooltip = useMetricsTooltip<HTMLSpanElement>();

  const labelClasses =
    "text-xs text-gray-500 uppercase tracking-wider font-medium";

  const resolvedPoolDetails = poolDetails ?? [];
  const hasPoolDetails = poolDetails !== undefined;

  // Compact card container with p-4 instead of p-6
  const CompactCard = ({ children, error = false }: { children: React.ReactNode; error?: boolean }) => (
    <div
      className={`${
        error
          ? "bg-gray-900/50 border border-red-900/30 hover:border-red-800/50"
          : "bg-gray-900/50 border border-gray-800 hover:border-gray-700"
      } rounded-xl p-4 h-full flex flex-col items-center justify-center relative overflow-hidden group transition-colors`}
    >
      {/* Decorative icon */}
      <div
        className="absolute -right-6 -top-6 p-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none select-none"
        aria-hidden="true"
      >
        <Wallet className="w-20 h-20 md:w-24 md:h-24 text-blue-400" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        {children}
      </div>
    </div>
  );

  // Loading state
  if (metricState.shouldRenderSkeleton) {
    return (
      <CompactCard>
        <div className="h-8 flex items-center mb-1">
          <BalanceSkeleton size="default" />
        </div>
        <p className={labelClasses}>Total Balance</p>
      </CompactCard>
    );
  }

  // Error state (but not USER_NOT_FOUND, which shows welcome elsewhere)
  if (shouldShowError && errorMessage && errorMessage !== "USER_NOT_FOUND") {
    return (
      <CompactCard error={true}>
        <div className="text-xl font-bold text-white h-8 flex items-center mb-1">
          <div className="flex flex-col space-y-1">
            <div className="text-sm text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          </div>
        </div>
        <p className={labelClasses}>Total Balance</p>
      </CompactCard>
    );
  }

  // Connected but no data
  if (shouldShowNoDataMessage) {
    return (
      <NoDataMetricCard
        icon={Wallet}
        iconClassName="text-blue-400"
        label="Total Balance"
        labelClassName={labelClasses}
      />
    );
  }

  // Normal portfolio display - COMPACT VERSION
  const displayValue = getDisplayTotalValue
    ? getDisplayTotalValue()
    : totalNetUsd;

  return (
    <CompactCard>
      {/* Reduced font size: text-xl/2xl instead of text-3xl/4xl */}
      <div className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1 break-all sm:break-normal text-center">
        {formatCurrency(displayValue ?? 0, { isHidden: balanceHidden })}
      </div>

      {/* Inline label with info icon */}
      <div className="flex items-center justify-center space-x-1.5">
        <p className={labelClasses}>Total Balance</p>
        {hasPoolDetails && (
          <div className="relative">
            <span
              ref={poolTooltip.triggerRef}
              onClick={poolTooltip.toggle}
              onKeyDown={e => e.key === "Enter" && poolTooltip.toggle()}
              role="button"
              tabIndex={0}
              aria-label="Pool details breakdown"
              className="inline-flex cursor-help"
            >
              <Info className="w-3 h-3 text-gray-500 hover:text-gray-400 transition-colors" />
            </span>
            {poolTooltip.visible && (
              <PoolDetailsTooltip
                tooltipRef={poolTooltip.tooltipRef}
                position={poolTooltip.position}
                poolDetails={resolvedPoolDetails}
                totalPositions={totalPositions}
                protocolsCount={protocolsCount}
                chainsCount={chainsCount}
              />
            )}
          </div>
        )}
      </div>
    </CompactCard>
  );
}

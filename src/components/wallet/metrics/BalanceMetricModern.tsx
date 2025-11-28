import { AlertCircle, Info, Wallet } from "lucide-react";

import { BalanceSkeleton } from "@/components/ui/LoadingSystem";
import { useMetricState } from "@/hooks/useMetricState";
import { formatCurrency } from "@/lib/formatters";
import type { PoolDetail } from "@/types/pool";

import { PoolDetailsTooltip, useMetricsTooltip } from "../tooltips";
import { NoDataMetricCard } from "./common/NoDataMetricCard";

interface BalanceMetricModernProps {
  totalNetUsd?: number | null;
  isLoading?: boolean;
  shouldShowLoading?: boolean;
  balanceHidden?: boolean;
  shouldShowError?: boolean;
  errorMessage?: string | null;
  shouldShowNoDataMessage?: boolean;
  getDisplayTotalValue?: () => number | null;
  poolDetails?: PoolDetail[];
  totalPositions?: number;
  protocolsCount?: number;
  chainsCount?: number;
}

/**
 * Modern balance metric with gradient accents and optimized vertical spacing.
 *
 * Key features:
 * - Compact padding: p-3 for reduced height
 * - Moderate fonts: text-lg/xl for readability
 * - Left gradient accent border (blue-to-purple)
 * - Badge-style label at top
 * - Pill-style chips for pool stats
 * - Fixed height (h-[140px]) for consistent alignment
 *
 * @example
 * ```tsx
 * <BalanceMetricModern totalNetUsd={15000} />
 * ```
 */
export function BalanceMetricModern({
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
}: BalanceMetricModernProps) {
  const metricState = useMetricState({
    isLoading,
    shouldShowLoading,
    value: totalNetUsd,
  });

  const poolTooltip = useMetricsTooltip<HTMLSpanElement>();

  const resolvedPoolDetails = poolDetails ?? [];
  const hasPoolDetails = poolDetails !== undefined;

  // Modern card with left gradient accent
  const ModernCard = ({
    children,
    error = false,
  }: {
    children: React.ReactNode;
    error?: boolean;
  }) => (
    <div
      className={`relative ${
        error
          ? "bg-gray-900/50 border border-red-900/30 hover:border-red-800/50"
          : "bg-gray-900/50 border border-gray-800 hover:border-gray-700"
      } rounded-xl overflow-hidden transition-colors h-[140px]`}
    >
      {/* Left gradient accent */}
      {!error && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500" />
      )}

      <div className="p-3 h-full flex flex-col items-center justify-start pt-2">
        {children}
      </div>
    </div>
  );

  // Loading state
  if (metricState.shouldRenderSkeleton) {
    return (
      <ModernCard>
        <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-0.5">
          <span className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">
            Balance
          </span>
        </div>
        <div className="h-8 flex items-center">
          <BalanceSkeleton size="default" />
        </div>
      </ModernCard>
    );
  }

  // Error state
  if (shouldShowError && errorMessage && errorMessage !== "USER_NOT_FOUND") {
    return (
      <ModernCard error={true}>
        <div className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 mb-0.5">
          <span className="text-[10px] text-red-400 uppercase tracking-wider font-medium">
            Balance
          </span>
        </div>
        <div className="text-sm text-red-400 flex items-center space-x-1.5">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs">{errorMessage}</span>
        </div>
      </ModernCard>
    );
  }

  // No data
  if (shouldShowNoDataMessage) {
    return (
      <NoDataMetricCard
        icon={Wallet}
        iconClassName="text-blue-400"
        label="Balance"
        labelClassName="text-xs text-gray-500 uppercase tracking-wider font-medium"
      />
    );
  }

  // Modern display with badge label
  const displayValue = getDisplayTotalValue
    ? getDisplayTotalValue()
    : totalNetUsd;

  return (
    <ModernCard>
      {/* Badge label at top */}
      <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-0.5">
        <span className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">
          Balance
        </span>
      </div>

      {/* Main value */}
      <div className="flex items-center justify-center gap-2 mb-1.5">
        <div className="text-lg md:text-xl font-bold text-white tracking-tight">
          {formatCurrency(displayValue ?? 0, { isHidden: balanceHidden })}
        </div>
        {hasPoolDetails && (
          <div className="relative flex items-center">
            <span
              ref={poolTooltip.triggerRef}
              onClick={poolTooltip.toggle}
              onKeyDown={e => e.key === "Enter" && poolTooltip.toggle()}
              role="button"
              tabIndex={0}
              aria-label="Pool details"
              className="inline-flex cursor-help text-gray-500 hover:text-blue-400 transition-colors"
            >
              <Info className="w-4 h-4" />
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

      {/* Pool stats as pill chips */}
      {hasPoolDetails &&
        ((totalPositions ?? 0) > 0 ||
          (protocolsCount ?? 0) > 0 ||
          (chainsCount ?? 0) > 0) && (
          <div className="flex items-center gap-1 flex-wrap justify-center">
            {(totalPositions ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-gray-800/50 text-[9px] text-gray-400">
                {totalPositions} pos
              </span>
            )}
            {(protocolsCount ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-gray-800/50 text-[9px] text-gray-400">
                {protocolsCount} proto
              </span>
            )}
            {(chainsCount ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-gray-800/50 text-[9px] text-gray-400">
                {chainsCount} chains
              </span>
            )}
          </div>
        )}
    </ModernCard>
  );
}

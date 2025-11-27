import { AlertCircle, Info, Wallet } from "lucide-react";

import { BalanceSkeleton } from "@/components/ui/LoadingSystem";
import { useMetricState } from "@/hooks/useMetricState";
import { formatCurrency } from "@/lib/formatters";
import type { PoolDetail } from "@/types/pool";

import { PoolDetailsTooltip, useMetricsTooltip } from "../tooltips";
import { NoDataMetricCard } from "./common/NoDataMetricCard";

interface BalanceMetricV2Props {
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
 * Variation 2: Minimal Clean version with maximum height reduction (40-50%).
 *
 * Key changes from original:
 * - Aggressive padding: p-3 instead of p-6 (save 24px)
 * - Smallest fonts: text-base/lg instead of text-3xl/4xl
 * - Ultra-compact spacing: mb-0.5, minimal gaps
 * - Simplified layout: value and label in tight vertical stack
 *
 * @example
 * ```tsx
 * <BalanceMetricV2 totalNetUsd={15000} />
 * ```
 */
export function BalanceMetricV2({
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
}: BalanceMetricV2Props) {
  const metricState = useMetricState({
    isLoading,
    shouldShowLoading,
    value: totalNetUsd,
  });

  const poolTooltip = useMetricsTooltip<HTMLSpanElement>();

  const labelClasses = "text-[10px] text-gray-500 uppercase tracking-wider font-medium";
  const resolvedPoolDetails = poolDetails ?? [];
  const hasPoolDetails = poolDetails !== undefined;

  // Minimal card with p-3
  const MinimalCard = ({ children, error = false }: { children: React.ReactNode; error?: boolean }) => (
    <div
      className={`${
        error
          ? "bg-gray-900/50 border border-red-900/30 hover:border-red-800/50"
          : "bg-gray-900/50 border border-gray-800 hover:border-gray-700"
      } rounded-xl p-3 h-full flex flex-col items-center justify-center transition-colors`}
    >
      {children}
    </div>
  );

  // Loading state
  if (metricState.shouldRenderSkeleton) {
    return (
      <MinimalCard>
        <div className="h-6 flex items-center mb-0.5">
          <BalanceSkeleton size="default" />
        </div>
        <p className={labelClasses}>Balance</p>
      </MinimalCard>
    );
  }

  // Error state
  if (shouldShowError && errorMessage && errorMessage !== "USER_NOT_FOUND") {
    return (
      <MinimalCard error={true}>
        <div className="text-sm text-red-400 flex items-center space-x-1.5">
          <AlertCircle className="w-3 h-3" />
          <span className="text-xs">{errorMessage}</span>
        </div>
        <p className={labelClasses}>Balance</p>
      </MinimalCard>
    );
  }

  // No data
  if (shouldShowNoDataMessage) {
    return (
      <NoDataMetricCard
        icon={Wallet}
        iconClassName="text-blue-400"
        label="Balance"
        labelClassName={labelClasses}
      />
    );
  }

  // Minimal display
  const displayValue = getDisplayTotalValue ? getDisplayTotalValue() : totalNetUsd;

  return (
    <MinimalCard>
      {/* Smallest font: text-base/lg */}
      <div className="text-base md:text-lg font-bold text-white tracking-tight mb-0.5 text-center">
        {formatCurrency(displayValue ?? 0, { isHidden: balanceHidden })}
      </div>

      <div className="flex items-center justify-center space-x-1">
        <p className={labelClasses}>Balance</p>
        {hasPoolDetails && (
          <div className="relative">
            <span
              ref={poolTooltip.triggerRef}
              onClick={poolTooltip.toggle}
              onKeyDown={e => e.key === "Enter" && poolTooltip.toggle()}
              role="button"
              tabIndex={0}
              aria-label="Pool details"
              className="inline-flex cursor-help"
            >
              <Info className="w-2.5 h-2.5 text-gray-500 hover:text-gray-400" />
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
    </MinimalCard>
  );
}

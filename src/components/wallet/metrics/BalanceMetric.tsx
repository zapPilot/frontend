import { AlertCircle } from "lucide-react";

import { BalanceSkeleton } from "@/components/ui/LoadingSystem";
import { useMetricState } from "@/hooks/useMetricState";
import { formatCurrency } from "@/lib/formatters";

interface BalanceMetricProps {
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
}

/**
 * Displays user's total net balance with loading, error, and hidden states.
 *
 * Extracted from WalletMetrics (lines 129-164) to create a focused,
 * single-responsibility component for balance display.
 *
 * @example
 * ```tsx
 * <BalanceMetric
 *   totalNetUsd={15000}
 *   balanceHidden={false}
 *   isLoading={false}
 *   shouldShowLoading={false}
 * />
 * ```
 */
export function BalanceMetric({
  totalNetUsd,
  isLoading,
  shouldShowLoading,
  balanceHidden = false,
  shouldShowError = false,
  errorMessage,
  shouldShowNoDataMessage = false,
  getDisplayTotalValue,
}: BalanceMetricProps) {
  const metricState = useMetricState({
    isLoading,
    shouldShowLoading,
    value: totalNetUsd,
  });

  // Loading state
  if (metricState.shouldRenderSkeleton) {
    return (
      <div>
        <p className="text-sm text-gray-400 mb-1">Total Balance</p>
        <div className="text-3xl font-bold text-white h-10 flex items-center">
          <div className="flex items-center space-x-2">
            <BalanceSkeleton size="default" />
          </div>
        </div>
      </div>
    );
  }

  // Error state (but not USER_NOT_FOUND, which shows welcome elsewhere)
  if (shouldShowError && errorMessage && errorMessage !== "USER_NOT_FOUND") {
    return (
      <div>
        <p className="text-sm text-gray-400 mb-1">Total Balance</p>
        <div className="text-3xl font-bold text-white h-10 flex items-center">
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Connected but no data
  if (shouldShowNoDataMessage) {
    return (
      <div>
        <p className="text-sm text-gray-400 mb-1">Total Balance</p>
        <div className="text-3xl font-bold text-white h-10 flex items-center">
          <div className="text-gray-400 text-lg">No data available</div>
        </div>
      </div>
    );
  }

  // Normal portfolio display
  const displayValue = getDisplayTotalValue
    ? getDisplayTotalValue()
    : totalNetUsd;

  return (
    <div>
      <p className="text-sm text-gray-400 mb-1">Total Balance</p>
      <div className="text-3xl font-bold text-white h-10 flex items-center">
        {formatCurrency(displayValue ?? 0, { isHidden: balanceHidden })}
      </div>
    </div>
  );
}

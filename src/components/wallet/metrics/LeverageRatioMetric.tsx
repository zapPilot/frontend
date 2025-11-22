import { AlertCircle, Info, Shield } from "lucide-react";
import React from "react";

import { useMetricState } from "@/hooks/useMetricState";
import {
  formatHealthFactor,
  formatLeverageRatio,
  LEVERAGE_COLORS,
  type LeverageMetrics,
} from "@/lib/leverageUtils";

import { MetricCard } from "./MetricCard";

interface LeverageRatioMetricProps {
  /** Leverage metrics data */
  leverageMetrics?: LeverageMetrics | null;
  /** Is the data loading? */
  isLoading?: boolean;
  /** Should show loading state? */
  shouldShowLoading?: boolean;
  /** Should show error state? */
  shouldShowError?: boolean;
  /** Error message to display */
  errorMessage?: string | null;
  /** Should show no data message? */
  shouldShowNoDataMessage?: boolean;
}

/**
 * Displays portfolio leverage ratio with health status indicator.
 *
 * Shows user's leverage position with color-coded risk levels following
 * DeFi industry standards:
 * - Safe: < 2.0x (green)
 * - Moderate: 2.0-3.0x (amber)
 * - High: 3.0-4.0x (orange)
 * - Critical: > 4.0x (rose)
 *
 * @example
 * ```tsx
 * <LeverageRatioMetric
 *   leverageMetrics={metrics}
 *   isLoading={false}
 *   shouldShowLoading={false}
 * />
 * ```
 */
export function LeverageRatioMetric({
  leverageMetrics,
  isLoading,
  shouldShowLoading,
  shouldShowError = false,
  errorMessage,
  shouldShowNoDataMessage = false,
}: LeverageRatioMetricProps) {
  const metricState = useMetricState({
    isLoading,
    shouldShowLoading,
    value: leverageMetrics?.ratio,
  });

  const labelClasses = "text-xs text-gray-500 uppercase tracking-wider font-medium";

  // Get color scheme based on health status
  const colorScheme = leverageMetrics
    ? LEVERAGE_COLORS[leverageMetrics.healthStatus]
    : LEVERAGE_COLORS.safe;

  // Loading state
  if (metricState.shouldRenderSkeleton) {
    return (
      <MetricCard icon={Shield} iconClassName="text-purple-400" isLoading>
        <div className="h-10 flex items-center mb-2">
          <div className="h-8 w-24 bg-gray-700/50 rounded animate-pulse" />
        </div>
        <p className={labelClasses}>Leverage Ratio</p>
      </MetricCard>
    );
  }

  // Error state
  if (shouldShowError && errorMessage) {
    return (
      <MetricCard icon={Shield} iconClassName="text-purple-400" error>
        <div className="text-3xl font-bold text-white h-10 flex items-center mb-2">
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          </div>
        </div>
        <p className={labelClasses}>Leverage Ratio</p>
      </MetricCard>
    );
  }

  // No data state
  if (shouldShowNoDataMessage || !leverageMetrics) {
    return (
      <MetricCard icon={Shield} iconClassName="text-purple-400">
        <div className="text-3xl font-bold text-white h-10 flex items-center mb-2">
          <div className="text-gray-400 text-lg">No data</div>
        </div>
        <p className={labelClasses}>Leverage Ratio</p>
      </MetricCard>
    );
  }

  // No debt state - show unleveraged position
  if (!leverageMetrics.hasDebt) {
    return (
      <MetricCard icon={Shield} iconClassName="text-emerald-400">
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className={`text-3xl md:text-4xl font-bold ${colorScheme.text} tracking-tight`}>
            {formatLeverageRatio(leverageMetrics.ratio)}
          </div>
          <div className={`px-3 py-1 rounded-full ${colorScheme.bg} ${colorScheme.border} border text-xs font-medium ${colorScheme.text}`}>
            Unleveraged
          </div>
        </div>
        <p className={labelClasses}>Leverage Ratio</p>
      </MetricCard>
    );
  }

  // Normal display with leverage
  const healthFactorDisplay = formatHealthFactor(leverageMetrics.healthFactor);
  const isFiniteHealthFactor = isFinite(leverageMetrics.healthFactor);

  return (
    <MetricCard
      icon={Shield}
      iconClassName={leverageMetrics.healthStatus === 'critical' ? 'text-rose-400' : 'text-purple-400'}
    >
      <div className="flex flex-col items-center gap-2 mb-2 w-full">
        {/* Main leverage ratio */}
        <div className={`text-3xl md:text-4xl font-bold ${colorScheme.text} tracking-tight`}>
          {formatLeverageRatio(leverageMetrics.ratio)}
        </div>

        {/* Health status badge and health factor */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div
            className={`px-3 py-1 rounded-full ${colorScheme.bg} ${colorScheme.border} border text-xs font-medium ${colorScheme.text}`}
            role="status"
            aria-label={`Health status: ${leverageMetrics.healthLabel}`}
          >
            {leverageMetrics.healthLabel}
          </div>

          {isFiniteHealthFactor && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>HF:</span>
              <span className="font-medium text-gray-300">{healthFactorDisplay}</span>
              <button
                type="button"
                className="hover:text-gray-200 transition-colors"
                aria-label="Health factor information"
                title="Health Factor: Higher values indicate safer positions. Based on assets/debt ratio."
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Debt percentage (optional detail) */}
        {leverageMetrics.debtPercentage > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {leverageMetrics.debtPercentage.toFixed(1)}% debt
          </div>
        )}
      </div>

      <p className={labelClasses}>Leverage Ratio</p>
    </MetricCard>
  );
}

/**
 * Inline leverage badge for use in headers or compact displays.
 * Alternative to the full MetricCard when space is constrained.
 */
export function LeverageBadge({
  leverageMetrics,
  compact = false,
}: {
  leverageMetrics: LeverageMetrics | null;
  compact?: boolean;
}) {
  if (!leverageMetrics?.hasDebt) {
    return null;
  }

  const colorScheme = LEVERAGE_COLORS[leverageMetrics.healthStatus];
  const healthFactorDisplay = formatHealthFactor(leverageMetrics.healthFactor);
  const isFiniteHealthFactor = isFinite(leverageMetrics.healthFactor);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${colorScheme.bg} ${colorScheme.border} border`}
        role="status"
        aria-label={`Leverage ratio: ${formatLeverageRatio(leverageMetrics.ratio)}, ${leverageMetrics.healthLabel}`}
      >
        <Shield className={`w-4 h-4 ${colorScheme.icon}`} />
        <span className={`text-sm font-semibold ${colorScheme.text}`}>
          {formatLeverageRatio(leverageMetrics.ratio)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg ${colorScheme.bg} ${colorScheme.border} border`}
      role="status"
    >
      <div className="flex items-center gap-2">
        <Shield className={`w-5 h-5 ${colorScheme.icon}`} />
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${colorScheme.text}`}>
            Leverage: {formatLeverageRatio(leverageMetrics.ratio)}
          </span>
          <span className="text-xs text-gray-400">
            {leverageMetrics.healthLabel}
            {isFiniteHealthFactor && ` • HF: ${healthFactorDisplay}`}
          </span>
        </div>
      </div>
    </div>
  );
}

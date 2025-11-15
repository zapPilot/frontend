import { AlertCircle, Clock, Info, TrendingUp } from "lucide-react";
import React from "react";

import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";

import { usePortfolioStateHelpers } from "../../hooks/usePortfolioState";
import { useResolvedBalanceVisibility } from "../../hooks/useResolvedBalanceVisibility";
import { getChangeColorClasses } from "../../lib/color-utils";
import { formatCurrency, formatPercentage } from "../../lib/formatters";
import type {
  LandingPageResponse,
  ProtocolYieldBreakdown,
  YieldReturnsSummaryResponse,
} from "../../services/analyticsService";
import { PortfolioState } from "../../types/portfolioState";
import { BalanceSkeleton, WalletMetricsSkeleton } from "../ui/LoadingSystem";
import {
  ProtocolROIItem,
  ROITooltip,
  selectBestYieldWindow,
  useMetricsTooltip,
  YieldBreakdownTooltip,
} from "./tooltips";
import { WelcomeNewUser } from "./WelcomeNewUser";

interface WalletMetricsProps {
  portfolioState: PortfolioState;
  balanceHidden?: boolean;
  portfolioChangePercentage: number;
  userId?: string | null;
  // PROGRESSIVE LOADING: Split data sources for independent metric rendering
  landingPageData?: LandingPageResponse | null | undefined;
  yieldSummaryData?: YieldReturnsSummaryResponse | null | undefined;
  // Independent loading states for progressive disclosure
  isLandingLoading?: boolean;
  isYieldLoading?: boolean;
}

// Removed unused types and functions - using ROI helpers from lib

export const WalletMetrics = React.memo<WalletMetricsProps>(
  ({
    portfolioState,
    balanceHidden,
    portfolioChangePercentage,
    landingPageData,
    yieldSummaryData,
    isLandingLoading = false,
    isYieldLoading = false,
  }) => {
    const resolvedHidden = useResolvedBalanceVisibility(balanceHidden);
    // Split data sources for progressive loading
    const data = landingPageData;

    // Tooltip state using shared hook
    const roiTooltip = useMetricsTooltip();
    const yieldTooltip = useMetricsTooltip();

    // Use portfolio state helpers for consistent logic
    const {
      shouldShowLoading,
      shouldShowNoDataMessage,
      shouldShowError,
      getDisplayTotalValue,
    } = usePortfolioStateHelpers(portfolioState);

    const portfolioROI = data?.portfolio_roi;

    // Use recommended_yearly_roi directly from API (as percentage, not decimal)
    const estimatedYearlyROI = portfolioROI?.recommended_yearly_roi
      ? portfolioROI.recommended_yearly_roi / 100
      : null;

    // Use estimated_yearly_pnl_usd directly from API
    const estimatedYearlyPnL = portfolioROI?.estimated_yearly_pnl_usd;

    // --- YIELD DATA LOGIC (from separate yield summary query) ---

    // Some older flows still inject yield_summary via landingPageData.
    // Fall back to that structure when the dedicated yield query hasn't resolved yet
    // so legacy screens/tests keep working while progressive loading is rolled out.
    const resolvedYieldSummary =
      yieldSummaryData ?? landingPageData?.yield_summary ?? null;

    // 1. Get all yield windows from the resolved yield summary data
    const yieldWindows = resolvedYieldSummary?.windows;

    // 2. Select the best window from the available windows
    const selectedYieldWindow = yieldWindows
      ? selectBestYieldWindow(yieldWindows)
      : null;

    // 3. Extract metrics from the *selected* window
    const avgDailyYieldUsd = selectedYieldWindow
      ? selectedYieldWindow.window.average_daily_yield_usd
      : null;

    // 4. Get the protocol breakdown from the *selected* window
    const protocolYieldBreakdown: ProtocolYieldBreakdown[] =
      selectedYieldWindow?.window.protocol_breakdown ?? [];
    const hasProtocolBreakdown = protocolYieldBreakdown.length > 0;

    // 5. Get outliers from the *selected* window's statistics
    const outliersRemoved = selectedYieldWindow
      ? selectedYieldWindow.window.statistics.outliers_removed
      : 0;

    // --- END YIELD LOGIC ---

    // Convert windows object to array format expected by the UI
    // Sort by time period (ascending) to show shorter periods first
    const roiWindows = portfolioROI?.windows
      ? Object.entries(portfolioROI.windows)
          .map(([key, value]) => ({
            key,
            label: formatRoiWindowLabel(key),
            value: value.value,
            dataPoints: value.data_points,
          }))
          .sort(
            (a, b) =>
              deriveRoiWindowSortScore(a.key) - deriveRoiWindowSortScore(b.key)
          ) // Shortest period first
      : [];

    const protocolROIData: ProtocolROIItem[] = [];

    // Helper function to render balance display using centralized state
    const renderBalanceDisplay = () => {
      // Loading state
      if (shouldShowLoading) {
        return (
          <div className="flex items-center space-x-2">
            <BalanceSkeleton size="default" />
          </div>
        );
      }

      // Error state
      if (shouldShowError) {
        // Special handling for new users (404 errors)
        if (portfolioState.errorMessage === "USER_NOT_FOUND") {
          return null; // Component will show welcome message below
        }
        // Regular error display for other errors
        return (
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{portfolioState.errorMessage}</span>
            </div>
          </div>
        );
      }

      // Connected but no data
      if (shouldShowNoDataMessage) {
        return <div className="text-gray-400 text-lg">No data available</div>;
      }

      // Normal portfolio display
      const displayValue = getDisplayTotalValue();
      return formatCurrency(displayValue ?? 0, { isHidden: resolvedHidden });
    };

    // Helper function to render ROI display with consistent state handling
    const renderROIDisplay = () => {
      // PROGRESSIVE LOADING: Only check portfolio state + landing data availability
      if (shouldShowLoading || isLandingLoading) {
        return (
          <WalletMetricsSkeleton showValue={true} showPercentage={false} />
        );
      }

      // Error state - show welcome for new users
      if (portfolioState.errorMessage === "USER_NOT_FOUND") {
        return null; // Component will show welcome message
      }

      // No data available - prioritize actual data over state helpers
      if (!estimatedYearlyROI) {
        return (
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-xl font-semibold">No data available</span>
            </div>
          </div>
        );
      }

      // Normal display with data
      const recommendedPeriodLabel =
        portfolioROI?.recommended_period?.replace("roi_", "") ||
        (portfolioROI?.windows &&
        Object.prototype.hasOwnProperty.call(portfolioROI.windows, "roi_30d")
          ? "30d"
          : !portfolioState.isConnected
            ? "30d"
            : undefined);

      return (
        <div className="flex flex-col">
          <div
            className={`flex items-center space-x-2 ${getChangeColorClasses(portfolioChangePercentage)}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-xl font-semibold">
              {formatPercentage(estimatedYearlyROI * 100, false, 2)}
            </span>
            <span className="text-xs text-purple-400 font-medium bg-purple-900/20 px-1.5 py-0.5 rounded-full">
              est.
            </span>
          </div>
          {recommendedPeriodLabel && (
            <span className="text-xs text-gray-500 font-normal mt-1">
              Based on {recommendedPeriodLabel} performance data
            </span>
          )}
        </div>
      );
    };

    // Helper function to render PnL display with consistent state handling
    const renderPnLDisplay = () => {
      // PROGRESSIVE LOADING: Only check portfolio state + landing data availability
      if (shouldShowLoading || isLandingLoading) {
        return (
          <WalletMetricsSkeleton
            showValue={true}
            showPercentage={false}
            className="w-24"
          />
        );
      }

      // Error state - show welcome for new users
      if (portfolioState.errorMessage === "USER_NOT_FOUND") {
        return null; // Component will show welcome message
      }

      // No data available - prioritize actual data over state helpers
      if (!estimatedYearlyPnL) {
        return (
          <div className="flex items-center space-x-2 text-gray-400">
            <p className="text-xl font-semibold">No data available</p>
          </div>
        );
      }

      // Normal display with data
      return (
        <div
          className={`flex items-center space-x-2 ${getChangeColorClasses(portfolioChangePercentage)}`}
        >
          <p className="text-xl font-semibold">
            {formatCurrency(estimatedYearlyPnL, {
              smartPrecision: true,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <span className="text-xs text-purple-400 font-medium bg-purple-900/20 px-1.5 py-0.5 rounded-full">
            est.
          </span>
        </div>
      );
    };

    // Helper to determine yield display state based on data availability
    const determineYieldState = () => {
      if (!resolvedYieldSummary || avgDailyYieldUsd === null) {
        return { status: "no_data" as const, daysWithData: 0 };
      }

      // Use selected window's data points if available, otherwise fall back to legacy stats
      const daysWithData = selectedYieldWindow
        ? selectedYieldWindow.window.statistics.filtered_days
        : 0;

      if (daysWithData < 7) {
        return {
          status: "insufficient" as const,
          daysWithData,
          badge: "Preliminary",
        };
      }

      if (daysWithData < 30) {
        return {
          status: "low_confidence" as const,
          daysWithData,
          badge: "Improving",
        };
      }

      return { status: "normal" as const, daysWithData };
    };

    const renderAvgDailyYieldDisplay = () => {
      // PROGRESSIVE LOADING: Independent yield loading state
      // Only check isYieldLoading - do NOT check shouldShowLoading
      // (shouldShowLoading tracks landing page API, not yield API)
      if (isYieldLoading) {
        return (
          <WalletMetricsSkeleton
            showValue={true}
            showPercentage={false}
            className="w-24"
          />
        );
      }

      if (portfolioState.errorMessage === "USER_NOT_FOUND") {
        return null;
      }

      const yieldState = determineYieldState();

      // No data state - educational message
      if (yieldState.status === "no_data") {
        return (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2 text-purple-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Available in 1 day</span>
            </div>
            <p className="text-xs text-gray-500">
              After 24 hours of portfolio activity
            </p>
          </div>
        );
      }

      // Safety guard: formatting helpers require a numeric value
      if (avgDailyYieldUsd === null) {
        return null;
      }

      // Insufficient or low confidence state
      if (
        yieldState.status === "insufficient" ||
        yieldState.status === "low_confidence"
      ) {
        return (
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 text-emerald-300">
              <p className="text-xl font-semibold">
                {formatCurrency(avgDailyYieldUsd, {
                  smartPrecision: true,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  yieldState.status === "insufficient"
                    ? "bg-yellow-900/20 text-yellow-400"
                    : "bg-blue-900/20 text-blue-400"
                }`}
              >
                {yieldState.badge}
              </span>
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {yieldState.status === "insufficient"
                ? `Early estimate (${yieldState.daysWithData}/7 days)`
                : `Based on ${yieldState.daysWithData} days`}
            </span>
          </div>
        );
      }

      // Normal state
      return (
        <div className="flex items-center space-x-2 text-emerald-300">
          <p className="text-xl font-semibold">
            {formatCurrency(avgDailyYieldUsd, {
              smartPrecision: true,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      );
    };

    // Show welcome message for new users
    if (portfolioState.errorMessage === "USER_NOT_FOUND") {
      return <WelcomeNewUser />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-400 mb-1">Total Balance</p>
          <div className="text-3xl font-bold text-white h-10 flex items-center">
            {renderBalanceDisplay()}
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-1 mb-1">
            <p className="text-sm text-gray-400">
              Estimated Yearly ROI{" "}
              {!portfolioState.isConnected ? "(Potential)" : ""}
            </p>
            {portfolioROI && (
              <div className="relative">
                <span
                  ref={roiTooltip.triggerRef}
                  onClick={roiTooltip.toggle}
                  onKeyDown={e => e.key === "Enter" && roiTooltip.toggle()}
                  role="button"
                  tabIndex={0}
                  aria-label="Portfolio ROI tooltip"
                  className="inline-flex"
                >
                  <Info className="w-3 h-3 text-gray-500 cursor-help" />
                </span>
                {roiTooltip.visible && (
                  <ROITooltip
                    tooltipRef={roiTooltip.tooltipRef}
                    position={roiTooltip.position}
                    windows={roiWindows}
                    protocols={protocolROIData}
                    recommendedPeriodLabel={
                      portfolioROI?.recommended_period?.replace("roi_", "") ||
                      null
                    }
                  />
                )}
              </div>
            )}
          </div>
          {renderROIDisplay()}
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Estimated Yearly PnL</p>
          {renderPnLDisplay()}
        </div>

        <div>
          <div className="flex items-center space-x-1 mb-1">
            <p className="text-sm text-gray-400">Avg Daily Yield</p>
            {outliersRemoved > 0 && (
              <span
                title={`${outliersRemoved} outlier${outliersRemoved === 1 ? "" : "s"} removed for accuracy (IQR method)`}
                className="inline-flex"
              >
                <Info className="w-3 h-3 text-gray-500 cursor-help" />
              </span>
            )}
            {hasProtocolBreakdown && (
              <div className="relative">
                {yieldTooltip.visible && (
                  <YieldBreakdownTooltip
                    tooltipRef={yieldTooltip.tooltipRef}
                    position={yieldTooltip.position}
                    selectedWindow={selectedYieldWindow}
                    allWindows={yieldWindows}
                    breakdown={protocolYieldBreakdown}
                    outliersRemoved={outliersRemoved}
                  />
                )}
              </div>
            )}
          </div>
          {renderAvgDailyYieldDisplay()}
        </div>
      </div>
    );
  }
);

WalletMetrics.displayName = "WalletMetrics";

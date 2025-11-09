import { AlertCircle, Clock, Info, TrendingUp } from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";

import { deriveRoiWindowSortScore, formatRoiWindowLabel } from "@/lib/roi";

import { usePortfolioStateHelpers } from "../../hooks/usePortfolioState";
import { useResolvedBalanceVisibility } from "../../hooks/useResolvedBalanceVisibility";
import { getChangeColorClasses } from "../../lib/color-utils";
import { formatCurrency, formatPercentage } from "../../lib/formatters";
import type { LandingPageResponse } from "../../services/analyticsService";
import { PortfolioState } from "../../types/portfolioState";
import { BalanceSkeleton, WalletMetricsSkeleton } from "../ui/LoadingSystem";
import { ProtocolROIItem, ROITooltip } from "./ROITooltip";
import { WelcomeNewUser } from "./WelcomeNewUser";

interface WalletMetricsProps {
  portfolioState: PortfolioState;
  balanceHidden?: boolean;
  portfolioChangePercentage: number;
  userId?: string | null;
  // If provided, use this data instead of fetching again
  landingPageData?: LandingPageResponse | null | undefined;
}

// Removed unused types and functions - using ROI helpers from lib

export const WalletMetrics = React.memo<WalletMetricsProps>(
  ({
    portfolioState,
    balanceHidden,
    portfolioChangePercentage,
    landingPageData,
  }) => {
    const resolvedHidden = useResolvedBalanceVisibility(balanceHidden);
    // Data must be provided by parent; no internal fetching
    const data = landingPageData;
    const landingPageLoading = !data && portfolioState.isLoading;

    // ROI tooltip portal state
    const [roiTooltipVisible, setRoiTooltipVisible] = useState(false);
    const [roiTooltipPos, setRoiTooltipPos] = useState<{
      top: number;
      left: number;
    }>({ top: 0, left: 0 });
    const infoIconRef = useRef<HTMLSpanElement | null>(null);

    const openRoiTooltip = useCallback(() => {
      const el = infoIconRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setRoiTooltipPos({
        top: rect.bottom + 8 + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
      setRoiTooltipVisible(true);
    }, []);
    const closeRoiTooltip = useCallback(() => setRoiTooltipVisible(false), []);

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
    const avgDailyYieldUsd = data?.yield_roi?.avg_daily_yield_usd ?? null;

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

    // Extract and transform protocol yield data for tooltip display
    const protocolROIData: ProtocolROIItem[] = useMemo(() => {
      const protocolBreakdown = data?.yield_roi?.breakdown?.by_protocol;
      if (!protocolBreakdown || protocolBreakdown.length === 0) return [];

      return protocolBreakdown
        .map(protocol => ({
          protocol: protocol.protocol_name,
          chain: protocol.chain,
          netYieldUsd: protocol.net_yield_usd,
          tokenYieldUsd: protocol.token_yield_usd,
          rewardYieldUsd: protocol.reward_yield_usd,
          rewardTokenCount: protocol.reward_token_count,
        }))
        .sort((a, b) => b.netYieldUsd - a.netYieldUsd)
        .slice(0, 7); // Show top 7 protocols by net yield
    }, [data?.yield_roi?.breakdown?.by_protocol]);

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
      // Loading state
      if (shouldShowLoading || landingPageLoading) {
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
      // Loading state
      if (shouldShowLoading || landingPageLoading) {
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
      if (!data?.yield_roi || avgDailyYieldUsd === null) {
        return { status: "no_data" as const, daysWithData: 0 };
      }

      const daysWithData = data.yield_roi.days_with_data || 0;

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
      if (shouldShowLoading || landingPageLoading) {
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

      // Insufficient or low confidence state
      if (
        yieldState.status === "insufficient" ||
        yieldState.status === "low_confidence"
      ) {
        return (
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 text-emerald-300">
              <p className="text-xl font-semibold">
                {formatCurrency(avgDailyYieldUsd!, {
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
            {formatCurrency(avgDailyYieldUsd!, {
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
                  ref={infoIconRef}
                  onMouseOver={openRoiTooltip}
                  onMouseOut={closeRoiTooltip}
                  className="inline-flex"
                >
                  <Info className="w-3 h-3 text-gray-500 cursor-help" />
                </span>
                {roiTooltipVisible && (
                  <ROITooltip
                    position={roiTooltipPos}
                    windows={roiWindows}
                    protocols={protocolROIData}
                    recommendedPeriodLabel={
                      portfolioROI?.recommended_period?.replace("roi_", "") ||
                      null
                    }
                    onMouseEnter={openRoiTooltip}
                    onMouseLeave={closeRoiTooltip}
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
          <p className="text-sm text-gray-400 mb-1">Avg Daily Yield</p>
          {renderAvgDailyYieldDisplay()}
        </div>
      </div>
    );
  }
);

WalletMetrics.displayName = "WalletMetrics";

import { Z_INDEX } from "@/constants/design-system";
import { AlertCircle, Info, TrendingUp } from "lucide-react";
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBalanceVisibility } from "../../contexts/BalanceVisibilityContext";
import { usePortfolioStateHelpers } from "../../hooks/usePortfolioState";
import { getChangeColorClasses } from "../../lib/color-utils";
import { formatCurrency, formatSmallCurrency } from "../../lib/formatters";
import type { LandingPageResponse } from "../../services/analyticsService";
import { PortfolioState } from "../../types/portfolioState";
import { WalletMetricsSkeleton } from "../ui/LoadingState";
import { BalanceLoading } from "../ui/UnifiedLoading";

interface WalletMetricsProps {
  portfolioState: PortfolioState;
  balanceHidden?: boolean;
  portfolioChangePercentage: number;
  userId?: string | null;
  // If provided, use this data instead of fetching again
  landingPageData?: LandingPageResponse | null | undefined;
}

interface WelcomeNewUserProps {
  onGetStarted?: () => void;
}

function WelcomeNewUser({ onGetStarted }: WelcomeNewUserProps) {
  return (
    <div className="flex flex-col space-y-4 p-6 rounded-lg bg-purple-900/20 border border-purple-600/30 backdrop-blur-sm">
      <div className="flex items-center space-x-3 text-purple-400">
        <div className="p-2 bg-purple-600/20 rounded-lg">
          <div className="w-6 h-6 text-purple-400">✨</div>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">
            Welcome to Zap Pilot!
          </h3>
          <p className="text-sm text-purple-300">
            Ready to start your DeFi journey?
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed">
        Connect your wallet to create your personalized portfolio and explore
        automated yield strategies across multiple DeFi protocols. Start
        optimizing your crypto investments today!
      </p>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onGetStarted}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          Get Started
        </button>
        <button className="px-4 py-2 border border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-purple-200 font-medium rounded-lg transition-colors">
          Learn More
        </button>
      </div>
    </div>
  );
}

type PortfolioRoiWindow = {
  value: number;
  data_points: number;
};

type RoiWindowEntry = {
  key: string;
  label: string;
  value: number;
  dataPoints: number;
};

const ROI_WINDOW_PREFIX = "roi_";

const isPortfolioRoiWindow = (value: unknown): value is PortfolioRoiWindow => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PortfolioRoiWindow>;
  return (
    typeof candidate.value === "number" &&
    typeof candidate.data_points === "number"
  );
};

const deriveRoiWindowSortScore = (key: string) => {
  const period = key.replace(/^roi_/, "");
  const match = period.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [, amountStr, unit] = match;
  const amount = Number(amountStr);
  if (!Number.isFinite(amount)) {
    return Number.MAX_SAFE_INTEGER;
  }

  switch (unit) {
    case "d":
      return amount;
    case "w":
      return amount * 7;
    case "m":
      return amount * 30;
    case "y":
      return amount * 365;
    default:
      return Number.MAX_SAFE_INTEGER;
  }
};

const formatRoiWindowLabel = (key: string) => {
  const period = key.replace(/^roi_/, "");
  if (period === "all") {
    return "All time";
  }

  const match = period.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/);
  if (!match) {
    return period;
  }

  const [, amount, unit] = match;
  switch (unit) {
    case "d":
      return `${amount} days`;
    case "w":
      return `${amount} weeks`;
    case "m":
      return `${amount} months`;
    case "y":
      return `${amount} years`;
    default:
      return period;
  }
};

const buildRoiWindowEntries = (
  roi?: LandingPageResponse["portfolio_roi"]
): RoiWindowEntry[] => {
  if (!roi) {
    return [];
  }

  const entries: Array<RoiWindowEntry & { sortScore: number }> = [];

  for (const [key, value] of Object.entries(roi)) {
    if (!key.startsWith(ROI_WINDOW_PREFIX) || key === "roi_windows") {
      continue;
    }

    if (isPortfolioRoiWindow(value)) {
      entries.push({
        key,
        label: formatRoiWindowLabel(key),
        value: value.value,
        dataPoints: value.data_points,
        sortScore: deriveRoiWindowSortScore(key),
      });
    }
  }

  return entries
    .sort((a, b) => a.sortScore - b.sortScore)
    .map(entry => {
      const { sortScore, ...rest } = entry;
      void sortScore;
      return rest;
    });
};

export const WalletMetrics = React.memo<WalletMetricsProps>(
  ({
    portfolioState,
    balanceHidden,
    portfolioChangePercentage,
    landingPageData,
  }) => {
    const { balanceHidden: ctxHidden } = useBalanceVisibility();
    const resolvedHidden = balanceHidden ?? ctxHidden;
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

    const openRoiTooltip = () => {
      const el = infoIconRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setRoiTooltipPos({
        top: rect.bottom + 8 + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
      setRoiTooltipVisible(true);
    };
    const closeRoiTooltip = () => setRoiTooltipVisible(false);

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

    const roiWindows = portfolioROI;
    const roiWindowEntries = buildRoiWindowEntries(roiWindows);

    // Helper function to render balance display using centralized state
    const renderBalanceDisplay = () => {
      // Loading state
      if (shouldShowLoading) {
        return (
          <div className="flex items-center space-x-2">
            <BalanceLoading size="default" className="" />
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
      return (
        <div className="flex flex-col">
          <div
            className={`flex items-center space-x-2 ${getChangeColorClasses(portfolioChangePercentage)}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-xl font-semibold">
              {(estimatedYearlyROI * 100).toFixed(2)}%
            </span>
            <span className="text-xs text-purple-400 font-medium bg-purple-900/20 px-1.5 py-0.5 rounded-full">
              est.
            </span>
          </div>
          {portfolioROI?.recommended_roi_period && (
            <span className="text-xs text-gray-500 font-normal mt-1">
              Based on{" "}
              {portfolioROI?.recommended_roi_period.replace("roi_", "")}{" "}
              performance data
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
            {formatSmallCurrency(estimatedYearlyPnL)}
          </p>
          <span className="text-xs text-purple-400 font-medium bg-purple-900/20 px-1.5 py-0.5 rounded-full">
            est.
          </span>
        </div>
      );
    };

    // Show welcome message for new users
    if (portfolioState.errorMessage === "USER_NOT_FOUND") {
      return <WelcomeNewUser />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  onMouseEnter={openRoiTooltip}
                  onMouseLeave={closeRoiTooltip}
                  className="inline-flex"
                >
                  <Info className="w-3 h-3 text-gray-500 cursor-help" />
                </span>
                {roiTooltipVisible &&
                  createPortal(
                    <div
                      onMouseEnter={openRoiTooltip}
                      onMouseLeave={closeRoiTooltip}
                      style={{
                        position: "fixed",
                        top: roiTooltipPos.top,
                        left: roiTooltipPos.left,
                        transform: "translateX(-50%)",
                      }}
                      className={`bg-gray-900 text-white text-xs rounded shadow-lg w-72 p-4 border border-gray-700 ${Z_INDEX.TOOLTIP}`}
                    >
                      <div className="font-semibold text-gray-200 mb-2 text-center">
                        📊 Portfolio ROI Estimation
                      </div>

                      {/* ROI Windows */}
                      {roiWindowEntries.length > 0 && (
                        <div className="mb-3 p-2 bg-gray-800 rounded">
                          <div className="text-gray-300 font-medium mb-2">
                            ROI by Time Period
                          </div>
                          {roiWindowEntries.map(entry => (
                            <div
                              key={entry.key}
                              className="flex justify-between text-gray-300 mb-1 last:mb-0"
                            >
                              <span>
                                {entry.label} ({entry.dataPoints} data points)
                              </span>
                              <span>{entry.value.toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Methodology Note */}
                      <div className="text-gray-400 text-xs leading-relaxed border-t border-gray-700 pt-2">
                        💡 <strong>Methodology:</strong> ROI estimates use
                        recent performance windows and scale linearly to yearly
                        projections. Estimates become more accurate as data
                        points increase over time.
                      </div>
                    </div>,
                    document.body
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
      </div>
    );
  }
);

WalletMetrics.displayName = "WalletMetrics";

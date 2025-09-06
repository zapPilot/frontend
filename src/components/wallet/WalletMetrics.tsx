import { AlertCircle, Info, TrendingUp } from "lucide-react";
import React, { useRef, useState } from "react";
import { useBalanceVisibility } from "../../contexts/BalanceVisibilityContext";
import { createPortal } from "react-dom";
import { useLandingPageData } from "../../hooks/queries/usePortfolioQuery";
import { usePortfolioStateHelpers } from "../../hooks/usePortfolioState";
import { getChangeColorClasses } from "../../lib/color-utils";
import { formatCurrency, formatSmallCurrency } from "../../lib/formatters";
import type { LandingPageResponse } from "../../services/analyticsEngine";
import { BUSINESS_CONSTANTS } from "../../styles/design-tokens";
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

export const WalletMetrics = React.memo<WalletMetricsProps>(
  ({
    portfolioState,
    balanceHidden,
    portfolioChangePercentage,
    userId,
    landingPageData,
  }) => {
    const { balanceHidden: ctxHidden } = useBalanceVisibility();
    const resolvedHidden = balanceHidden ?? ctxHidden;
    // Fetch unified landing page data (includes APR data) only if not provided via props
    const { data: fetchedData, isLoading: fetchedLoading } = useLandingPageData(
      landingPageData ? null : userId
    );
    const data = landingPageData ?? fetchedData;
    const landingPageLoading = landingPageData ? false : fetchedLoading;

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
      shouldShowConnectPrompt,
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

      // Wallet not connected
      if (shouldShowConnectPrompt) {
        return (
          <div className="text-gray-400 text-lg">Please Connect Wallet</div>
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

    // Use API-provided APR data or fall back to business constant default
    const displayAPR =
      estimatedYearlyROI ?? BUSINESS_CONSTANTS.PORTFOLIO.DEFAULT_APR;

    // Use estimated yearly PnL directly from API
    const displayYearlyPnL = estimatedYearlyPnL ?? 0;

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
              {shouldShowConnectPrompt ? "(Potential)" : ""}
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
                        zIndex: 2147483647,
                      }}
                      className="bg-gray-900 text-white text-xs rounded shadow-lg w-72 p-4 border border-gray-700"
                    >
                      <div className="font-semibold text-gray-200 mb-2 text-center">
                        📊 Portfolio ROI Estimation
                      </div>

                      {/* ROI Windows */}
                      {roiWindows && (
                        <div className="mb-3 p-2 bg-gray-800 rounded">
                          <div className="text-gray-300 font-medium mb-2">
                            ROI by Time Period
                          </div>
                          {roiWindows.roi_7d && (
                            <div className="flex justify-between text-gray-300 mb-1">
                              <span>
                                7 days ({roiWindows.roi_7d.data_points} data
                                points)
                              </span>
                              <span>{roiWindows.roi_7d.value.toFixed(2)}%</span>
                            </div>
                          )}
                          {roiWindows.roi_30d && (
                            <div className="flex justify-between text-gray-300 mb-1">
                              <span>
                                30 days ({roiWindows.roi_30d.data_points} data
                                points)
                              </span>
                              <span>
                                {roiWindows.roi_30d.value.toFixed(2)}%
                              </span>
                            </div>
                          )}
                          {roiWindows.roi_365d && (
                            <div className="flex justify-between text-gray-300">
                              <span>
                                365 days ({roiWindows.roi_365d.data_points} data
                                points)
                              </span>
                              <span>
                                {roiWindows.roi_365d.value.toFixed(2)}%
                              </span>
                            </div>
                          )}
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
          {(shouldShowLoading || landingPageLoading) &&
          portfolioState.errorMessage !== "USER_NOT_FOUND" ? (
            <WalletMetricsSkeleton showValue={true} showPercentage={false} />
          ) : (
            <>
              <div className="flex flex-col">
                <div
                  className={`flex items-center space-x-2 ${shouldShowConnectPrompt ? "text-purple-400" : getChangeColorClasses(portfolioChangePercentage)}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xl font-semibold">
                    {(displayAPR * 100).toFixed(2)}%
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
            </>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Estimated Yearly PnL</p>
          {(shouldShowLoading || landingPageLoading) &&
          portfolioState.errorMessage !== "USER_NOT_FOUND" ? (
            <WalletMetricsSkeleton
              showValue={true}
              showPercentage={false}
              className="w-24"
            />
          ) : (
            <div
              className={`flex items-center space-x-2 ${shouldShowConnectPrompt ? "text-gray-400" : getChangeColorClasses(portfolioChangePercentage)}`}
            >
              <p className="text-xl font-semibold">
                {shouldShowConnectPrompt
                  ? "Connect to calculate"
                  : formatSmallCurrency(displayYearlyPnL)}
              </p>
              {!shouldShowConnectPrompt && (
                <span className="text-xs text-purple-400 font-medium bg-purple-900/20 px-1.5 py-0.5 rounded-full">
                  est.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

WalletMetrics.displayName = "WalletMetrics";

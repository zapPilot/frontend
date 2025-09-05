import { AlertCircle, ChevronDown, Info, TrendingUp } from "lucide-react";
import React, { useState } from "react";
import { calculateMonthlyIncome } from "../../constants/portfolio";
import { useLandingPageData } from "../../hooks/queries/usePortfolioQuery";
import { usePortfolioStateHelpers } from "../../hooks/usePortfolioState";
import { getChangeColorClasses } from "../../lib/color-utils";
import { formatCurrency, formatSmallCurrency } from "../../lib/formatters";
import type { LandingPageResponse } from "../../services/analyticsEngine";
import { BUSINESS_CONSTANTS } from "../../styles/design-tokens";
import { PortfolioState } from "../../types/portfolioState";
import { normalizeApr } from "../../utils/portfolio.utils";
import { WalletMetricsSkeleton } from "../ui/LoadingState";
import { BalanceLoading } from "../ui/UnifiedLoading";

interface WalletMetricsProps {
  portfolioState: PortfolioState;
  balanceHidden: boolean;
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
    // State for debug UI
    const [showDebugInfo, setShowDebugInfo] = useState(false);

    // Fetch unified landing page data (includes APR data) only if not provided via props
    const { data: fetchedData, isLoading: fetchedLoading } = useLandingPageData(
      landingPageData ? null : userId
    );
    const data = landingPageData ?? fetchedData;
    const landingPageLoading = landingPageData ? false : fetchedLoading;

    // Use portfolio state helpers for consistent logic
    const {
      shouldShowLoading,
      shouldShowConnectPrompt,
      shouldShowNoDataMessage,
      shouldShowError,
      getDisplayTotalValue,
    } = usePortfolioStateHelpers(portfolioState);

    const portfolioROI = data?.portfolio_roi;
    // Use normalized APR from utility function
    const portfolioAPR =
      normalizeApr(portfolioROI?.recommended_roi) ??
      (typeof data?.weighted_apr === "number" ? data.weighted_apr : null);
    const estimatedMonthlyIncome =
      (typeof portfolioROI?.estimated_monthly_pnl_usd === "number"
        ? portfolioROI?.estimated_monthly_pnl_usd
        : null) ??
      data?.estimated_monthly_income ??
      null;
    const roiPeriod = portfolioROI?.recommended_roi_period;
    const roiWindows = portfolioROI?.roi_windows;

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
      return formatCurrency(displayValue ?? 0, { isHidden: balanceHidden });
    };

    // Use real APR data or fall back to default
    const displayAPR = portfolioAPR ?? BUSINESS_CONSTANTS.PORTFOLIO.DEFAULT_APR;
    const displayValue = getDisplayTotalValue();
    const displayMonthlyIncome =
      estimatedMonthlyIncome ??
      (displayValue ? calculateMonthlyIncome(displayValue, displayAPR) : 0);

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
              Portfolio ROI {shouldShowConnectPrompt ? "(Potential)" : ""}
            </p>
            {portfolioROI && (
              <div className="relative group">
                <Info className="w-3 h-3 text-gray-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 w-56 p-3 border border-gray-700">
                  <div className="font-semibold text-gray-200 mb-1">
                    APR Details
                  </div>
                  {typeof portfolioAPR === "number" && (
                    <div className="flex justify-between text-gray-300">
                      <span>Recommended ROI</span>
                      <span>{(portfolioAPR * 100).toFixed(2)}%</span>
                    </div>
                  )}
                  {roiPeriod && (
                    <div className="text-gray-400 mt-1">
                      Period: {roiPeriod}
                    </div>
                  )}
                  {typeof estimatedMonthlyIncome === "number" && (
                    <div className="flex justify-between text-gray-300 mt-2">
                      <span>Est. Monthly PnL</span>
                      <span>{formatSmallCurrency(estimatedMonthlyIncome)}</span>
                    </div>
                  )}
                  {roiWindows && Object.keys(roiWindows).length > 0 && (
                    <div className="mt-2">
                      <div className="text-gray-400 mb-1">ROI Windows</div>
                      <div className="space-y-0.5 max-h-40 overflow-auto pr-1">
                        {Object.entries(roiWindows).map(([period, roi]) => (
                          <div
                            key={period}
                            className="flex justify-between text-gray-300"
                          >
                            <span>{period}</span>
                            <span
                              className={`${roi >= 0 ? "text-green-400" : "text-red-400"}`}
                            >
                              {(roi * 100).toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {roiWindows && Object.keys(roiWindows).length > 0 && (
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="p-1 text-gray-500 hover:text-gray-400 transition-colors"
                title="Show ROI breakdown"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showDebugInfo ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
          {(shouldShowLoading || landingPageLoading) &&
          portfolioState.errorMessage !== "USER_NOT_FOUND" ? (
            <WalletMetricsSkeleton showValue={true} showPercentage={false} />
          ) : (
            <>
              <div
                className={`flex items-center space-x-2 ${shouldShowConnectPrompt ? "text-purple-400" : getChangeColorClasses(portfolioChangePercentage)}`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-xl font-semibold">
                  {(displayAPR * 100).toFixed(2)}%
                </span>
                {roiPeriod && (
                  <span className="text-xs text-gray-500 font-normal">
                    ({roiPeriod})
                  </span>
                )}
              </div>
              {showDebugInfo && roiWindows && (
                <div className="mt-2 p-2 bg-gray-800/50 rounded-lg text-xs">
                  <p className="text-gray-400 mb-1">ROI Windows:</p>
                  <div className="space-y-1">
                    {Object.entries(roiWindows).map(([period, roi]) => (
                      <div key={period} className="flex justify-between">
                        <span className="text-gray-300">{period}:</span>
                        <span
                          className={`${roi >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {(roi * 100).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Est. Monthly Income</p>
          {(shouldShowLoading || landingPageLoading) &&
          portfolioState.errorMessage !== "USER_NOT_FOUND" ? (
            <WalletMetricsSkeleton
              showValue={true}
              showPercentage={false}
              className="w-24"
            />
          ) : (
            <p
              className={`text-xl font-semibold ${shouldShowConnectPrompt ? "text-gray-400" : getChangeColorClasses(portfolioChangePercentage)}`}
            >
              {shouldShowConnectPrompt
                ? "Connect to calculate"
                : formatSmallCurrency(displayMonthlyIncome)}
            </p>
          )}
        </div>
      </div>
    );
  }
);

WalletMetrics.displayName = "WalletMetrics";

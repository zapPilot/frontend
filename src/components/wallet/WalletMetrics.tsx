import { AlertCircle, TrendingUp } from "lucide-react";
import React from "react";
import { useLandingPageData } from "../../hooks/queries/usePortfolioQuery";
import { calculateMonthlyIncome } from "../../constants/portfolio";
import { formatCurrency, formatSmallCurrency } from "../../lib/formatters";
import { getChangeColorClasses } from "../../lib/color-utils";
import { BUSINESS_CONSTANTS } from "../../styles/design-tokens";
import { BalanceLoading } from "../ui/UnifiedLoading";
import { WalletMetricsSkeleton } from "../ui/LoadingState";

interface WalletMetricsProps {
  totalValue: number | null;
  balanceHidden: boolean;
  isLoading: boolean;
  error: string | null;
  portfolioChangePercentage: number;
  onRetry?: () => void;
  isRetrying?: boolean;
  isConnected: boolean;
  userId?: string | null;
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
    totalValue,
    balanceHidden,
    isLoading,
    error,
    portfolioChangePercentage,
    onRetry,
    isRetrying,
    isConnected,
    userId,
  }) => {
    // Fetch unified landing page data (includes APR data)
    const { data: landingPageData, isLoading: landingPageLoading } =
      useLandingPageData(userId);

    const portfolioAPR = landingPageData?.weighted_apr || null;
    const estimatedMonthlyIncome =
      landingPageData?.estimated_monthly_income || null;

    // Helper function to render balance display
    const renderBalanceDisplay = () => {
      // Show loading when: 1) explicitly loading, 2) retrying, 3) wallet connected but no data yet
      const showLoader =
        isLoading ||
        isRetrying ||
        (isConnected && totalValue === null && !error);

      if (showLoader) {
        return (
          <div className="flex items-center space-x-2">
            <BalanceLoading size="default" className="" />
            <span className="text-lg text-gray-400">
              {isRetrying ? "Retrying..." : "Loading..."}
            </span>
          </div>
        );
      }
      if (error) {
        // Special handling for new users (404 errors)
        if (error === "USER_NOT_FOUND") {
          return null; // Component will show welcome message below
        }
        // Regular error display for other errors
        return (
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors underline self-start"
              >
                Retry
              </button>
            )}
          </div>
        );
      }
      if (totalValue === null) {
        return (
          <div className="text-gray-400 text-lg">Please Connect Wallet</div>
        );
      }
      return formatCurrency(totalValue, { isHidden: balanceHidden });
    };

    // Use real APR data or fall back to default
    const displayAPR = portfolioAPR ?? BUSINESS_CONSTANTS.PORTFOLIO.DEFAULT_APR;
    const displayMonthlyIncome =
      estimatedMonthlyIncome ??
      (totalValue ? calculateMonthlyIncome(totalValue, displayAPR) : 0);

    // Show welcome message for new users
    if (error === "USER_NOT_FOUND") {
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
          <p className="text-sm text-gray-400 mb-1">
            Portfolio APR {totalValue === null ? "(Potential)" : ""}
          </p>
          {(isLoading ||
            isRetrying ||
            landingPageLoading ||
            (isConnected && totalValue === null && !error)) &&
          error !== "USER_NOT_FOUND" ? (
            <WalletMetricsSkeleton showValue={true} showPercentage={false} />
          ) : (
            <div
              className={`flex items-center space-x-2 ${totalValue === null ? "text-purple-400" : getChangeColorClasses(portfolioChangePercentage)}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-xl font-semibold">
                {(displayAPR * 100).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Est. Monthly Income</p>
          {(isLoading ||
            isRetrying ||
            landingPageLoading ||
            (isConnected && totalValue === null && !error)) &&
          error !== "USER_NOT_FOUND" ? (
            <WalletMetricsSkeleton
              showValue={true}
              showPercentage={false}
              className="w-24"
            />
          ) : (
            <p
              className={`text-xl font-semibold ${totalValue === null ? "text-gray-400" : getChangeColorClasses(portfolioChangePercentage)}`}
            >
              {totalValue === null
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

import { AlertCircle, Loader, TrendingUp } from "lucide-react";
import React, { useMemo } from "react";
import { calculateMonthlyIncome } from "../../constants/portfolio";
import { formatCurrency, getChangeColorClasses } from "../../lib/utils";
import { BUSINESS_CONSTANTS } from "../../styles/design-tokens";
import { formatSmallCurrency } from "../../utils/formatters";

interface WalletMetricsProps {
  totalValue: number | null;
  balanceHidden: boolean;
  isLoading: boolean;
  error: string | null;
  portfolioChangePercentage: number;
  onRetry?: () => void;
  isRetrying?: boolean;
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
  }) => {
    // Helper function to render balance display
    const renderBalanceDisplay = () => {
      if (isLoading || isRetrying) {
        return (
          <div className="flex items-center space-x-2">
            <Loader className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-lg text-gray-400 animate-pulse">
              {isRetrying ? "Retrying..." : "Loading..."}
            </span>
          </div>
        );
      }
      if (error) {
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
      return formatCurrency(totalValue, balanceHidden);
    };

    // Calculate portfolio metrics
    const portfolioAPR = BUSINESS_CONSTANTS.PORTFOLIO.DEFAULT_APR;
    const estimatedMonthlyIncome = useMemo(() => {
      return totalValue ? calculateMonthlyIncome(totalValue, portfolioAPR) : 0;
    }, [totalValue, portfolioAPR]);

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
          {isLoading || isRetrying ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-700 rounded animate-pulse" />
              <div className="w-16 h-6 bg-gray-700 rounded animate-pulse" />
            </div>
          ) : (
            <div
              className={`flex items-center space-x-2 ${totalValue === null ? "text-purple-400" : getChangeColorClasses(portfolioChangePercentage)}`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-xl font-semibold">
                {portfolioAPR.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Est. Monthly Income</p>
          {isLoading || isRetrying ? (
            <div className="w-24 h-6 bg-gray-700 rounded animate-pulse" />
          ) : (
            <p
              className={`text-xl font-semibold ${totalValue === null ? "text-gray-400" : getChangeColorClasses(portfolioChangePercentage)}`}
            >
              {totalValue === null
                ? "Connect to calculate"
                : formatSmallCurrency(estimatedMonthlyIncome)}
            </p>
          )}
        </div>
      </div>
    );
  }
);

WalletMetrics.displayName = "WalletMetrics";

import { Loader, TrendingDown, TrendingUp } from "lucide-react";
import React, { useMemo } from "react";
import { formatCurrency, getChangeColorClasses } from "../../lib/utils";
import { BUSINESS_CONSTANTS } from "../../styles/design-tokens";
import { calculateMonthlyIncome } from "../../constants/portfolio";
import { formatSmallCurrency } from "../../utils/formatters";

interface WalletMetricsProps {
  totalValue: number | null;
  balanceHidden: boolean;
  isLoading: boolean;
  error: string | null;
  portfolioChangePercentage: number;
}

export const WalletMetrics = React.memo<WalletMetricsProps>(
  ({
    totalValue,
    balanceHidden,
    isLoading,
    error,
    portfolioChangePercentage,
  }) => {
    // Helper function to render balance display
    const renderBalanceDisplay = () => {
      if (isLoading || totalValue === null) {
        return <Loader className="w-8 h-8 animate-spin text-gray-500" />;
      }
      if (error) {
        return <div className="text-sm text-red-500">{error}</div>;
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
          <p className="text-sm text-gray-400 mb-1">Portfolio APR</p>
          <div
            className={`flex items-center space-x-2 ${getChangeColorClasses(portfolioChangePercentage)}`}
          >
            {portfolioChangePercentage >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-xl font-semibold">
              {portfolioAPR.toFixed(2)}%
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Est. Monthly Income</p>
          <p
            className={`text-xl font-semibold ${getChangeColorClasses(portfolioChangePercentage)}`}
          >
            {formatSmallCurrency(estimatedMonthlyIncome)}
          </p>
        </div>
      </div>
    );
  }
);

WalletMetrics.displayName = "WalletMetrics";

"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Eye,
  EyeOff,
  Loader,
  Settings,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { mockPortfolioData } from "../data/mockPortfolio";
import { usePortfolio } from "../hooks/usePortfolio";
import { formatCurrency, getChangeColorClasses } from "../lib/utils";
import { getPortfolioSummary } from "../services/quantEngine";
import { BUSINESS_CONSTANTS, GRADIENTS } from "../styles/design-tokens";
import { formatSmallCurrency } from "../utils/formatters";
import { PortfolioOverview } from "./PortfolioOverview";
import { WalletManager } from "./WalletManager";
import { GlassCard, GradientButton } from "./ui";

interface WalletPortfolioProps {
  onAnalyticsClick?: () => void;
  onOptimizeClick?: () => void;
  onZapInClick?: () => void;
  onZapOutClick?: () => void;
}

export function WalletPortfolio({
  onAnalyticsClick,
  onOptimizeClick,
  onZapInClick,
  onZapOutClick,
}: WalletPortfolioProps = {}) {
  const {
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
  } = usePortfolio(mockPortfolioData);

  const { userInfo, loading: isUserLoading } = useUser();
  const [apiTotalValue, setApiTotalValue] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to render balance display with consolidated logic
  const renderBalanceDisplay = () => {
    if (isLoading || apiTotalValue === null) {
      return <Loader className="w-8 h-8 animate-spin text-gray-500" />;
    }
    if (apiError) {
      return <div className="text-sm text-red-500">{apiError}</div>;
    }
    return formatCurrency(apiTotalValue, balanceHidden);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchSummary = async () => {
      if (!userInfo?.userId) {
        if (!isUserLoading) {
          setIsLoading(false);
        }
        setApiTotalValue(null);
        return;
      }

      setApiError(null);
      try {
        const summary = await getPortfolioSummary(userInfo.userId);
        const total = summary.metrics.total_value_usd;
        if (!cancelled) {
          setApiTotalValue(Number.isFinite(total) ? total : 0);
        }
      } catch (e) {
        if (!cancelled) {
          setApiError(
            e instanceof Error ? e.message : "Failed to load portfolio summary"
          );
          setApiTotalValue(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      cancelled = true;
    };
  }, [userInfo?.userId, isUserLoading]);

  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);

  const openWalletManager = useCallback(() => {
    setIsWalletManagerOpen(true);
  }, []);

  const closeWalletManager = useCallback(() => {
    setIsWalletManagerOpen(false);
  }, []);

  // Mock APR and monthly return data - in real app this would come from API
  const portfolioAPR = BUSINESS_CONSTANTS.PORTFOLIO.DEFAULT_APR;
  const estimatedMonthlyIncome = 1730;

  return (
    <div className="space-y-6">
      {/* Wallet Header */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${GRADIENTS.PRIMARY} flex items-center justify-center`}
            >
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Wallet</h1>
              <p className="text-sm text-gray-400">DeFi Portfolio Overview</p>
            </div>
          </div>

          <div className="flex space-x-2">
            {onAnalyticsClick && (
              <button
                onClick={onAnalyticsClick}
                className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300 cursor-pointer"
                title="View Analytics"
              >
                <BarChart3 className="w-5 h-5 text-gray-300" />
              </button>
            )}
            <button
              onClick={openWalletManager}
              className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300 cursor-pointer"
              title="Manage Wallets"
            >
              <Wallet className="w-5 h-5 text-gray-300" />
            </button>
            <button
              onClick={toggleBalanceVisibility}
              className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300 cursor-pointer"
              title={balanceHidden ? "Show Balance" : "Hide Balance"}
            >
              {balanceHidden ? (
                <EyeOff className="w-5 h-5 text-gray-300" />
              ) : (
                <Eye className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>
        </div>

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
              className={`flex items-center space-x-2 ${getChangeColorClasses(portfolioMetrics.totalChangePercentage)}`}
            >
              {portfolioMetrics.totalChangePercentage >= 0 ? (
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
              className={`text-xl font-semibold ${getChangeColorClasses(portfolioMetrics.totalChangePercentage)}`}
            >
              {formatSmallCurrency(estimatedMonthlyIncome)}
            </p>
          </div>
        </div>

        {/* Wallet Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <GradientButton
            gradient={GRADIENTS.SUCCESS}
            shadowColor="green-500"
            icon={ArrowUpRight}
            onClick={onZapInClick || (() => {})}
          >
            <span className="text-sm">Zap In</span>
          </GradientButton>

          <GradientButton
            gradient={GRADIENTS.DANGER}
            shadowColor="red-500"
            icon={ArrowDownLeft}
            onClick={onZapOutClick || (() => {})}
          >
            <span className="text-sm">Zap Out</span>
          </GradientButton>

          <GradientButton
            gradient={GRADIENTS.PRIMARY}
            shadowColor="purple-500"
            icon={Settings}
            onClick={onOptimizeClick || (() => {})}
          >
            <span className="text-sm">Optimize</span>
          </GradientButton>
        </div>
      </GlassCard>

      {/* Portfolio Overview */}
      <PortfolioOverview
        portfolioData={mockPortfolioData}
        expandedCategory={expandedCategory}
        onCategoryToggle={toggleCategoryExpansion}
        balanceHidden={balanceHidden}
        title="Asset Distribution"
      />

      {/* Wallet Manager Modal */}
      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={closeWalletManager}
      />
    </div>
  );
}

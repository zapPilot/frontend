"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Eye,
  EyeOff,
  Settings,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useCallback, useState } from "react";
import { mockPortfolioData } from "../data/mockPortfolio";
import { usePortfolio } from "../hooks/usePortfolio";
import { formatCurrency, getChangeColorClasses } from "../lib/utils";
import { AssetCategoriesDetail } from "./AssetCategoriesDetail";
import { PortfolioOverview } from "./PortfolioOverview";
import { WalletManager } from "./WalletManager";
import { GlassCard, GradientButton } from "./ui";

interface WalletPortfolioProps {
  onAnalyticsClick?: () => void;
}

export function WalletPortfolio({
  onAnalyticsClick,
}: WalletPortfolioProps = {}) {
  const {
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
    handleLegendItemClick,
  } = usePortfolio(mockPortfolioData);

  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false);

  const openWalletManager = useCallback(() => {
    setIsWalletManagerOpen(true);
  }, []);

  const closeWalletManager = useCallback(() => {
    setIsWalletManagerOpen(false);
  }, []);

  // Mock APR and monthly return data - in real app this would come from API
  const portfolioAPR = 18.5;
  const estimatedMonthlyIncome = 1730;

  return (
    <div className="space-y-6">
      {/* Wallet Header */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
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
                className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300"
                title="View Analytics"
              >
                <BarChart3 className="w-5 h-5 text-gray-300" />
              </button>
            )}
            <button
              onClick={openWalletManager}
              className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300"
              title="Manage Wallets"
            >
              <Wallet className="w-5 h-5 text-gray-300" />
            </button>
            <button
              onClick={toggleBalanceVisibility}
              className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300"
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
            <p className="text-3xl font-bold text-white">
              {formatCurrency(portfolioMetrics.totalValue, balanceHidden)}
            </p>
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
              ${estimatedMonthlyIncome.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Wallet Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <GradientButton
            gradient="from-green-600 to-emerald-600"
            shadowColor="green-500"
            icon={ArrowUpRight}
          >
            <span className="text-sm">ZapIn</span>
          </GradientButton>

          <GradientButton
            gradient="from-red-600 to-pink-600"
            shadowColor="red-500"
            icon={ArrowDownLeft}
          >
            <span className="text-sm">ZapOut</span>
          </GradientButton>

          <GradientButton
            gradient="from-purple-600 to-blue-600"
            shadowColor="purple-500"
            icon={Settings}
          >
            <span className="text-sm">Optimize</span>
          </GradientButton>
        </div>
      </GlassCard>

      {/* Portfolio Overview */}
      <PortfolioOverview
        portfolioData={mockPortfolioData}
        onLegendItemClick={handleLegendItemClick}
        title="Asset Distribution"
      />

      {/* Asset Categories Detail */}
      <AssetCategoriesDetail
        portfolioData={mockPortfolioData}
        expandedCategory={expandedCategory}
        onCategoryToggle={toggleCategoryExpansion}
        balanceHidden={balanceHidden}
      />

      {/* Wallet Manager Modal */}
      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={closeWalletManager}
      />
    </div>
  );
}

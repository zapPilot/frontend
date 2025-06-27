"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Eye,
  EyeOff,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { mockPortfolioData } from "../data/mockPortfolio";
import { usePortfolio } from "../hooks/usePortfolio";
import { formatCurrency, getChangeColorClasses } from "../lib/utils";
import { AssetCategoriesDetail } from "./AssetCategoriesDetail";
import { PortfolioOverview } from "./PortfolioOverview";
import { GlassCard, GradientButton } from "./ui";

export function WalletPortfolio() {
  const {
    balanceHidden,
    expandedCategory,
    portfolioMetrics,
    toggleBalanceVisibility,
    toggleCategoryExpansion,
    handleLegendItemClick,
  } = usePortfolio(mockPortfolioData);

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

          <button
            onClick={toggleBalanceVisibility}
            className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300"
          >
            {balanceHidden ? (
              <EyeOff className="w-5 h-5 text-gray-300" />
            ) : (
              <Eye className="w-5 h-5 text-gray-300" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Balance</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(portfolioMetrics.totalValue, balanceHidden)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">24h Change</p>
            <div
              className={`flex items-center space-x-2 ${getChangeColorClasses(portfolioMetrics.totalChangePercentage)}`}
            >
              {portfolioMetrics.totalChangePercentage >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-xl font-semibold">
                {portfolioMetrics.totalChangePercentage >= 0 ? "+" : ""}
                {portfolioMetrics.totalChangePercentage.toFixed(2)}%
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Value Change</p>
            <p
              className={`text-xl font-semibold ${getChangeColorClasses(portfolioMetrics.totalChangePercentage)}`}
            >
              {portfolioMetrics.totalChangePercentage >= 0 ? "+" : ""}
              {formatCurrency(portfolioMetrics.totalChange24h, balanceHidden)}
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
    </div>
  );
}

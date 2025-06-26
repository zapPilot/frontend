"use client";

import { motion } from "framer-motion";
import {
  PieChart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Wallet,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";

const mockPortfolioData = {
  totalBalance: 127583.42,
  totalBalanceChange: 8.7,
  totalBalanceChangeValue: 10234.56,
  portfolioAPR: 23.4,
  maxDrawdown: -12.3,
  riskScore: 6.8,
  composition: [
    {
      symbol: "ETH",
      name: "Ethereum",
      value: 42000.0,
      percentage: 32.9,
      color: "#627EEA",
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      value: 38000.0,
      percentage: 29.8,
      color: "#F7931A",
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      value: 25000.0,
      percentage: 19.6,
      color: "#2775CA",
    },
    {
      symbol: "LINK",
      name: "Chainlink",
      value: 15000.0,
      percentage: 11.8,
      color: "#375BD2",
    },
    {
      symbol: "AAVE",
      name: "Aave",
      value: 7583.42,
      percentage: 5.9,
      color: "#B6509E",
    },
  ],
};

export default function PortfolioDashboard() {
  const [balanceHidden, setBalanceHidden] = useState(false);

  const formatCurrency = (amount: number) => {
    if (balanceHidden) return "••••••••";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
              Portfolio Dashboard
            </h1>
            <p className="text-gray-400">
              Manage your DeFi portfolio with intent-based execution
            </p>
          </div>

          <button
            onClick={() => setBalanceHidden(!balanceHidden)}
            className="p-3 rounded-xl glass-morphism hover:bg-white/20 transition-all duration-300"
          >
            {balanceHidden ? (
              <EyeOff className="w-5 h-5 text-gray-300" />
            ) : (
              <Eye className="w-5 h-5 text-gray-300" />
            )}
          </button>
        </motion.div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-morphism rounded-3xl p-6 hover:transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div
                className={`flex items-center ${mockPortfolioData.totalBalanceChange >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {mockPortfolioData.totalBalanceChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {formatPercentage(mockPortfolioData.totalBalanceChange)}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Total Balance</p>
              <p className="text-2xl font-bold">
                {formatCurrency(mockPortfolioData.totalBalance)}
              </p>
              <p
                className={`text-sm ${mockPortfolioData.totalBalanceChange >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {mockPortfolioData.totalBalanceChange >= 0 ? "+" : ""}
                {formatCurrency(mockPortfolioData.totalBalanceChangeValue)}{" "}
                today
              </p>
            </div>
          </motion.div>

          {/* Portfolio APR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-morphism rounded-3xl p-6 hover:transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="animate-pulse">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Portfolio APR</p>
              <p className="text-2xl font-bold text-green-400">
                {mockPortfolioData.portfolioAPR}%
              </p>
              <p className="text-sm text-gray-400">Annual yield</p>
            </div>
          </motion.div>

          {/* Max Drawdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-morphism rounded-3xl p-6 hover:transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-600">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div className="text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Max Drawdown</p>
              <p className="text-2xl font-bold text-red-400">
                {mockPortfolioData.maxDrawdown}%
              </p>
              <p className="text-sm text-gray-400">Peak to trough</p>
            </div>
          </motion.div>

          {/* Risk Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-morphism rounded-3xl p-6 hover:transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-600">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <div className="text-orange-400">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Risk Score</p>
              <p className="text-2xl font-bold text-orange-400">
                {mockPortfolioData.riskScore}/10
              </p>
              <p className="text-sm text-gray-400">Moderate risk</p>
            </div>
          </motion.div>
        </div>

        {/* Portfolio Composition & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio Composition */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="lg:col-span-2 glass-morphism rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6 gradient-text">
              Portfolio Composition
            </h2>

            <div className="space-y-4">
              {mockPortfolioData.composition.map((asset, index) => (
                <motion.div
                  key={asset.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: asset.color }}
                    >
                      {asset.symbol}
                    </div>
                    <div>
                      <p className="font-semibold">{asset.name}</p>
                      <p className="text-sm text-gray-400">{asset.symbol}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(asset.value)}
                    </p>
                    <p className="text-sm text-gray-400">{asset.percentage}%</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="glass-morphism rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6 gradient-text">
              Quick Actions
            </h2>

            <div className="space-y-4">
              {/* ZapIn Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300"
              >
                <ArrowUpRight className="w-5 h-5" />
                <span>ZapIn</span>
              </motion.button>

              {/* ZapOut Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
              >
                <ArrowDownLeft className="w-5 h-5" />
                <span>ZapOut</span>
              </motion.button>

              {/* Rebalance Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Rebalance</span>
              </motion.button>

              {/* Connect Wallet */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 text-white font-semibold flex items-center justify-center space-x-2 hover:bg-white/20 transition-all duration-300"
              >
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
              </motion.button>
            </div>

            {/* Status Indicator */}
            <div className="mt-6 p-4 rounded-2xl bg-gray-900/50 border border-gray-800">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-400">
                  System Online
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Intent engine ready for execution
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

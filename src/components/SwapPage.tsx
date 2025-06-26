"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ChevronDown,
  Info,
  Settings,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency, getRiskLevelClasses } from "../lib/utils";
import { InvestmentOpportunity } from "../types/investment";
import { SwapToken } from "../types/swap";

interface SwapPageProps {
  strategy: InvestmentOpportunity;
  onBack: () => void;
}

const mockTokens: SwapToken[] = [
  { symbol: "USDC", name: "USD Coin", balance: 1500.0, price: 1.0 },
  { symbol: "USDT", name: "Tether", balance: 800.0, price: 1.0 },
  { symbol: "ETH", name: "Ethereum", balance: 2.5, price: 2400.0 },
  { symbol: "BTC", name: "Bitcoin", balance: 0.1, price: 45000.0 },
];

export function SwapPage({ strategy, onBack }: SwapPageProps) {
  const [fromToken, setFromToken] = useState<SwapToken>(mockTokens[0]);
  const [fromAmount, setFromAmount] = useState("");
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [slippage, setSlippage] = useState(0.5);

  const estimatedShares = fromAmount ? (parseFloat(fromAmount) / 100).toFixed(4) : "0";
  const minimumReceived = fromAmount ? (parseFloat(fromAmount) * 0.995).toFixed(2) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4"
      >
        <button
          onClick={onBack}
          className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Invest in Strategy</h1>
          <p className="text-gray-400">Swap tokens to invest in {strategy.name}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap Interface */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-morphism rounded-3xl p-6 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text">Swap</h2>
              <button className="p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300">
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* From Token */}
            <div className="space-y-4">
              <div className="glass-morphism rounded-2xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">From</span>
                  <span className="text-sm text-gray-400">
                    Balance: {formatCurrency(fromToken.balance * fromToken.price)}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowTokenSelector(true)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                    <span className="font-semibold text-white">{fromToken.symbol}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-gray-500 outline-none"
                  />
                  <button
                    onClick={() => setFromAmount(fromToken.balance.toString())}
                    className="px-3 py-1 rounded-lg bg-purple-600/20 text-purple-400 text-sm font-medium hover:bg-purple-600/30 transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Swap Arrow */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 rounded-full glass-morphism border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <ArrowDown className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>

              {/* To Strategy */}
              <div className="glass-morphism rounded-2xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">To</span>
                  <span className="text-sm text-gray-400">
                    Estimated: {estimatedShares} shares
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-r ${strategy.color} flex items-center justify-center`}>
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{strategy.name}</div>
                    <div className="text-sm text-gray-400">{strategy.category} Strategy</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {fromAmount ? (parseFloat(fromAmount) * 0.97).toFixed(2) : "0.0"}
                    </div>
                    <div className="text-sm text-gray-400">USD Value</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Swap Details */}
            {fromAmount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 p-4 rounded-2xl bg-gray-900/50 border border-gray-700"
              >
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price Impact</span>
                    <span className="text-green-400">{"<0.01%"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Network Fee</span>
                    <span className="text-white">~$2.50</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Minimum Received</span>
                    <span className="text-white">${minimumReceived}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Slippage Tolerance</span>
                    <span className="text-white">{slippage}%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Swap Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!fromAmount || parseFloat(fromAmount) <= 0}
              className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              {!fromAmount || parseFloat(fromAmount) <= 0 ? "Enter Amount" : "Swap & Invest"}
            </motion.button>
          </motion.div>
        </div>

        {/* Strategy Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Strategy Overview */}
          <div className="glass-morphism rounded-3xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold gradient-text mb-4">Strategy Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">APR</span>
                <span className="text-2xl font-bold text-green-400">{strategy.apr}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Risk Level</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getRiskLevelClasses(strategy.risk)}`}>
                  {strategy.risk}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">TVL</span>
                <span className="text-white font-semibold">{strategy.tvl}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Category</span>
                <span className="text-white font-semibold">{strategy.category}</span>
              </div>
            </div>
          </div>

          {/* Strategy Description */}
          <div className="glass-morphism rounded-3xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold gradient-text mb-4">How it Works</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {strategy.description}
            </p>
            <div className="flex items-center space-x-2 text-sm text-blue-400">
              <Info className="w-4 h-4" />
              <span>Learn more about this strategy</span>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="glass-morphism rounded-3xl p-6 border border-gray-800">
            <h3 className="text-lg font-bold gradient-text mb-4">Performance</h3>
            <div className="space-y-3">
              {[
                { period: "24h", change: "+2.4%" },
                { period: "7d", change: "+8.1%" },
                { period: "30d", change: "+12.7%" },
                { period: "1y", change: "+45.2%" },
              ].map((stat) => (
                <div key={stat.period} className="flex items-center justify-between">
                  <span className="text-gray-400">{stat.period}</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 font-semibold">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowTokenSelector(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-morphism rounded-3xl p-6 border border-gray-800 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Select Token</h3>
            <div className="space-y-2">
              {mockTokens.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => {
                    setFromToken(token);
                    setShowTokenSelector(false);
                  }}
                  className="w-full p-3 rounded-xl bg-gray-900/50 hover:bg-gray-900/70 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                    <div className="text-left">
                      <div className="font-semibold text-white">{token.symbol}</div>
                      <div className="text-sm text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{token.balance}</div>
                    <div className="text-sm text-gray-400">
                      {formatCurrency(token.balance * token.price)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
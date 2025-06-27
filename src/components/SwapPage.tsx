"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Info,
  PieChart as PieChartIcon,
  Settings,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useStrategyPortfolio } from "../hooks/useStrategyPortfolio";
import { formatCurrency, getRiskLevelClasses } from "../lib/utils";
import { InvestmentOpportunity } from "../types/investment";
import { SwapToken } from "../types/swap";
import { AssetCategoriesDetail } from "./AssetCategoriesDetail";
import { PieChart } from "./PieChart";

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

type TabType = "swap" | "allocation" | "performance" | "details";

export function SwapPage({ strategy, onBack }: SwapPageProps) {
  const [fromToken, setFromToken] = useState<SwapToken>(mockTokens[0]);
  const [fromAmount, setFromAmount] = useState("");
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("swap");

  const {
    portfolioData,
    expandedCategory,
    portfolioMetrics,
    pieChartData,
    toggleCategoryExpansion,
  } = useStrategyPortfolio(strategy.id);

  const estimatedShares = fromAmount
    ? (parseFloat(fromAmount) / 100).toFixed(4)
    : "0";
  const minimumReceived = fromAmount
    ? (parseFloat(fromAmount) * 0.995).toFixed(2)
    : "0";

  const tabs = [
    { id: "swap" as TabType, label: "Swap", icon: Zap },
    { id: "allocation" as TabType, label: "Allocation", icon: PieChartIcon },
    { id: "performance" as TabType, label: "Performance", icon: BarChart3 },
    { id: "details" as TabType, label: "Details", icon: Activity },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg glass-morphism hover:bg-white/10 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{strategy.name}</h1>
            <p className="text-gray-400">
              Invest • {strategy.apr}% APR • {strategy.risk} Risk
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-400">TVL: {strategy.tvl}</div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism rounded-2xl p-2 border border-gray-800"
      >
        <div className="grid grid-cols-4 gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[600px]"
      >
        {activeTab === "swap" && (
          <div className="glass-morphism rounded-3xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold gradient-text">Swap & Invest</h3>
              <Settings className="w-5 h-5 text-gray-400" />
            </div>

            <div className="max-w-md mx-auto space-y-4">
              {/* From */}
              <div className="p-5 rounded-2xl bg-gray-900/50 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">From</span>
                  <span className="text-sm text-gray-400">
                    {formatCurrency(fromToken.balance * fromToken.price)}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowTokenSelector(true)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                    <span className="font-semibold text-white">
                      {fromToken.symbol}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={e => setFromAmount(e.target.value)}
                    className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-gray-500 outline-none"
                  />
                  <button
                    onClick={() => setFromAmount(fromToken.balance.toString())}
                    className="px-3 py-1 rounded-lg bg-purple-600/20 text-purple-400 text-sm hover:bg-purple-600/30"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="p-3 rounded-full glass-morphism border border-gray-700">
                  <ArrowDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* To */}
              <div className="p-5 rounded-2xl bg-gray-900/50 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">To</span>
                  <span className="text-sm text-gray-400">
                    ~{estimatedShares} shares
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-r ${strategy.color} flex items-center justify-center`}
                  >
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">
                      {strategy.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {strategy.category}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {fromAmount
                      ? (parseFloat(fromAmount) * 0.97).toFixed(2)
                      : "0.0"}
                  </div>
                </div>
              </div>

              {/* Swap Details */}
              {fromAmount && (
                <div className="p-4 rounded-2xl bg-gray-900/30 border border-gray-700/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network Fee</span>
                      <span className="text-white">~$2.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Slippage</span>
                      <span className="text-white">0.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min. Received</span>
                      <span className="text-white">${minimumReceived}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                disabled={!fromAmount || parseFloat(fromAmount) <= 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold disabled:opacity-50"
              >
                {!fromAmount || parseFloat(fromAmount) <= 0
                  ? "Enter Amount"
                  : "Swap & Invest"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "allocation" && (
          <div className="glass-morphism rounded-3xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold gradient-text mb-6">
              Portfolio Allocation
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex justify-center">
                <PieChart data={pieChartData} size={250} strokeWidth={10} />
              </div>
              <div className="space-y-4">
                {pieChartData.map(item => (
                  <div
                    key={item.label}
                    className="p-4 rounded-2xl bg-gray-900/30 border border-gray-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-white">
                          {item.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {item.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatCurrency(item.value)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="glass-morphism rounded-3xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold gradient-text mb-6">
              Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  period: "24 Hours",
                  change: "+2.4%",
                  color: "text-green-400",
                  desc: "Daily return",
                },
                {
                  period: "7 Days",
                  change: "+8.1%",
                  color: "text-green-400",
                  desc: "Weekly return",
                },
                {
                  period: "30 Days",
                  change: "+12.7%",
                  color: "text-green-400",
                  desc: "Monthly return",
                },
                {
                  period: "1 Year",
                  change: "+45.2%",
                  color: "text-green-400",
                  desc: "Annual return",
                },
              ].map(stat => (
                <div
                  key={stat.period}
                  className="p-5 rounded-2xl bg-gray-900/30 border border-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">{stat.period}</span>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                    {stat.change}
                  </div>
                  <div className="text-sm text-gray-500">{stat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-6">
            <div className="glass-morphism rounded-3xl p-6 border border-gray-800">
              <div className="flex items-start space-x-4">
                <Info className="w-6 h-6 text-blue-400 mt-1" />
                <div>
                  <h3 className="text-xl font-bold gradient-text mb-3">
                    Strategy Overview
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {strategy.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-xl bg-gray-900/30">
                      <div className="text-sm text-gray-400">APR</div>
                      <div className="text-lg font-bold text-green-400">
                        {strategy.apr}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-900/30">
                      <div className="text-sm text-gray-400">Risk Level</div>
                      <div
                        className={`text-lg font-bold ${getRiskLevelClasses(strategy.risk)}`}
                      >
                        {strategy.risk}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-900/30">
                      <div className="text-sm text-gray-400">TVL</div>
                      <div className="text-lg font-bold text-white">
                        {strategy.tvl}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {portfolioData.length > 0 && (
              <AssetCategoriesDetail
                portfolioData={portfolioData}
                expandedCategory={expandedCategory}
                onCategoryToggle={toggleCategoryExpansion}
                title="Strategy Assets"
              />
            )}
          </div>
        )}
      </motion.div>

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
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Select Token</h3>
            <div className="space-y-2">
              {mockTokens.map(token => (
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
                      <div className="font-semibold text-white">
                        {token.symbol}
                      </div>
                      <div className="text-sm text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {token.balance}
                    </div>
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

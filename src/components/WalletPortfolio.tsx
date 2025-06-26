"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { PieChart, PieChartLegend } from "./PieChart";

interface AssetDetail {
  name: string;
  symbol: string;
  protocol: string;
  amount: number;
  value: number;
  apr: number;
  type: string; // e.g., "Staking", "Lending", "Liquidity Pool"
}

interface AssetCategory {
  id: string;
  name: string;
  color: string;
  totalValue: number;
  percentage: number;
  change24h: number;
  assets: AssetDetail[];
}

const mockPortfolioData: AssetCategory[] = [
  {
    id: "btc",
    name: "BTC",
    color: "#F7931A",
    totalValue: 45000,
    percentage: 35.3,
    change24h: 2.4,
    assets: [
      {
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        protocol: "Lido",
        amount: 1.234,
        value: 42000,
        apr: 4.2,
        type: "Staking"
      },
      {
        name: "Bitcoin",
        symbol: "BTC",
        protocol: "Native",
        amount: 0.087,
        value: 3000,
        apr: 0,
        type: "Holding"
      }
    ]
  },
  {
    id: "eth",
    name: "ETH",
    color: "#627EEA",
    totalValue: 38000,
    percentage: 29.8,
    change24h: 1.8,
    assets: [
      {
        name: "Liquid Staked ETH",
        symbol: "stETH",
        protocol: "Lido",
        amount: 12.5,
        value: 30000,
        apr: 3.8,
        type: "Liquid Staking"
      },
      {
        name: "Ethereum",
        symbol: "ETH",
        protocol: "Uniswap V3",
        amount: 3.2,
        value: 8000,
        apr: 12.5,
        type: "Liquidity Pool"
      }
    ]
  },
  {
    id: "stablecoin",
    name: "STABLECOIN",
    color: "#2775CA",
    totalValue: 25000,
    percentage: 19.6,
    change24h: 0.1,
    assets: [
      {
        name: "USD Coin",
        symbol: "USDC",
        protocol: "Aave",
        amount: 20000,
        value: 20000,
        apr: 5.2,
        type: "Lending"
      },
      {
        name: "Tether",
        symbol: "USDT",
        protocol: "Compound",
        amount: 5000,
        value: 5000,
        apr: 4.8,
        type: "Lending"
      }
    ]
  },
  {
    id: "altcoin",
    name: "ALTCOIN",
    color: "#B6509E",
    totalValue: 19500,
    percentage: 15.3,
    change24h: -1.2,
    assets: [
      {
        name: "Chainlink",
        symbol: "LINK",
        protocol: "Chainlink Staking",
        amount: 800,
        value: 12000,
        apr: 7.5,
        type: "Staking"
      },
      {
        name: "Aave",
        symbol: "AAVE",
        protocol: "Aave Safety",
        amount: 50,
        value: 7500,
        apr: 6.8,
        type: "Safety Module"
      }
    ]
  }
];

export function WalletPortfolio() {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const totalValue = mockPortfolioData.reduce((sum, cat) => sum + cat.totalValue, 0);
  const totalChange24h = mockPortfolioData.reduce((sum, cat) => sum + (cat.totalValue * cat.change24h / 100), 0);
  const totalChangePercentage = (totalChange24h / totalValue) * 100;

  const pieChartData = mockPortfolioData.map(cat => ({
    label: cat.name,
    value: cat.totalValue,
    percentage: cat.percentage,
    color: cat.color
  }));

  const formatCurrency = (amount: number) => {
    if (balanceHidden) return "••••••••";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    if (balanceHidden) return "••••";
    return amount.toLocaleString('en-US', { maximumFractionDigits: 4 });
  };

  return (
    <div className="space-y-6">
      {/* Wallet Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism rounded-3xl p-6 border border-gray-800"
      >
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
            onClick={() => setBalanceHidden(!balanceHidden)}
            className="p-3 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300"
          >
            {balanceHidden ? (
              <EyeOff className="w-5 h-5 text-gray-300" />
            ) : (
              <Eye className="w-5 h-5 text-gray-300" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Balance</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(totalValue)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-1">24h Change</p>
            <div className={`flex items-center space-x-2 ${totalChangePercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalChangePercentage >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-xl font-semibold">
                {totalChangePercentage >= 0 ? '+' : ''}{totalChangePercentage.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-1">Value Change</p>
            <p className={`text-xl font-semibold ${totalChangePercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalChangePercentage >= 0 ? '+' : ''}{formatCurrency(totalChange24h)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Portfolio Overview and Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-morphism rounded-3xl p-6 border border-gray-800"
        >
          <h2 className="text-xl font-bold gradient-text mb-6">Asset Distribution</h2>
          <PieChart data={pieChartData} size={250} />
        </motion.div>

        {/* Category Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-morphism rounded-3xl p-6 border border-gray-800"
        >
          <h2 className="text-xl font-bold gradient-text mb-6">Categories</h2>
          <PieChartLegend 
            data={pieChartData} 
            onItemClick={(item) => {
              const category = mockPortfolioData.find(cat => cat.name === item.label);
              if (category) {
                setSelectedCategory(category.id);
                setExpandedCategory(expandedCategory === category.id ? null : category.id);
              }
            }}
          />
        </motion.div>
      </div>

      {/* Asset Categories Detail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism rounded-3xl p-6 border border-gray-800"
      >
        <h2 className="text-xl font-bold gradient-text mb-6">Portfolio Details</h2>
        
        <div className="space-y-4">
          {mockPortfolioData.map((category, categoryIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="border border-gray-800 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className="w-full p-4 bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="text-left">
                    <div className="font-semibold text-white">{category.name}</div>
                    <div className="text-sm text-gray-400">
                      {category.assets.length} assets • {category.percentage}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold text-white">
                      {formatCurrency(category.totalValue)}
                    </div>
                    <div className={`text-sm ${category.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {category.change24h >= 0 ? '+' : ''}{category.change24h}%
                    </div>
                  </div>
                  
                  {expandedCategory === category.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-800"
                  >
                    <div className="p-4 space-y-3">
                      {category.assets.map((asset, assetIndex) => (
                        <motion.div
                          key={`${asset.symbol}-${asset.protocol}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: assetIndex * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-300">
                                {asset.symbol.slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-white">{asset.name}</div>
                              <div className="text-sm text-gray-400">
                                {asset.protocol} • {asset.type}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-white">
                              {formatCurrency(asset.value)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {formatNumber(asset.amount)} {asset.symbol}
                            </div>
                            <div className="text-sm text-green-400">
                              {asset.apr}% APR
                            </div>
                          </div>
                          
                          <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="p-6 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold flex items-center justify-center space-x-3 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300"
        >
          <ArrowUpRight className="w-6 h-6" />
          <div className="text-left">
            <div className="text-lg">ZapIn</div>
            <div className="text-sm opacity-90">Add liquidity optimally</div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="p-6 rounded-2xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold flex items-center justify-center space-x-3 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
        >
          <ArrowDownLeft className="w-6 h-6" />
          <div className="text-left">
            <div className="text-lg">ZapOut</div>
            <div className="text-sm opacity-90">Exit with minimal slippage</div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="p-6 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold flex items-center justify-center space-x-3 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
        >
          <Settings className="w-6 h-6" />
          <div className="text-left">
            <div className="text-lg">Optimize</div>
            <div className="text-sm opacity-90">Rebalance for max yield</div>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
}
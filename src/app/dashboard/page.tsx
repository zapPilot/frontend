"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Settings,
  Crown,
  TrendingUp,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { usePortfolioData } from "../../hooks/usePortfolioData";
import { useSubscription } from "../../hooks/useSubscription";
import { WalletPortfolio } from "../../components/WalletPortfolio";
import { AnalyticsDashboard } from "../../components/MoreTab/AnalyticsDashboard";
import { PricingPage } from "../../components/PricingPage";
import {
  SubscriptionGate,
  RealtimeDataGate,
  AdvancedAnalyticsGate,
  HistoricalDataGate,
} from "../../components/SubscriptionGate";
import { GlassCard, GradientButton } from "../../components/ui";
import { GRADIENTS } from "../../styles/design-tokens";

export default function DashboardPage() {
  const {
    subscriptionStatus,
    currentTier,
    isLoading: subscriptionLoading,
  } = useSubscription();

  const {
    portfolioData,
    portfolioMetrics,
    aprMetrics,
    featuredStrategies,
    topPools,
    isLoading,
    isRefreshing,
    error,
    refreshPortfolio,
    setWalletAddress,
  } = usePortfolioData();

  const [showPricing, setShowPricing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  // Mock wallet connection for POC
  useEffect(() => {
    const mockWalletAddress = "0x742f35Cc6B8B6D0E73cF426A70F8B1D7A8E8C8A9";
    setConnectedWallet(mockWalletAddress);
    setWalletAddress(mockWalletAddress);
  }, [setWalletAddress]);

  const handleRefresh = async () => {
    if (currentTier.id === "free") {
      // Free tier users get rate limited
      const lastRefresh = localStorage.getItem("last_manual_refresh");
      const now = Date.now();

      if (lastRefresh && now - parseInt(lastRefresh) < 24 * 60 * 60 * 1000) {
        alert(
          "Free tier users can only refresh once per day. Upgrade to Pro for real-time updates!"
        );
        return;
      }

      localStorage.setItem("last_manual_refresh", now.toString());
    }

    await refreshPortfolio();
  };

  if (showPricing) {
    return <PricingPage onClose={() => setShowPricing(false)} />;
  }

  if (showAnalytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <GradientButton
              onClick={() => setShowAnalytics(false)}
              gradient={GRADIENTS.SECONDARY}
              shadowColor="gray-500"
            >
              ← Back to Portfolio
            </GradientButton>
          </div>

          <AdvancedAnalyticsGate>
            <AnalyticsDashboard />
          </AdvancedAnalyticsGate>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold gradient-text">
                Zap Pilot Dashboard
              </h1>

              {/* Subscription Status Badge */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  currentTier.id === "free"
                    ? "bg-gray-900/50 text-gray-400 border border-gray-700"
                    : currentTier.id === "pro"
                      ? "bg-purple-900/50 text-purple-300 border border-purple-700"
                      : "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                }`}
              >
                {currentTier.name}
                {currentTier.id !== "free" && (
                  <Crown className="w-3 h-3 inline ml-1" />
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Refresh Button */}
              <RealtimeDataGate>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-300 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                  title="Refresh Portfolio Data"
                >
                  <RefreshCw className="w-5 h-5 text-gray-300" />
                </button>
              </RealtimeDataGate>

              {/* Pricing Button */}
              <GradientButton
                onClick={() => setShowPricing(true)}
                gradient={
                  currentTier.id === "free"
                    ? GRADIENTS.PRIMARY
                    : GRADIENTS.SECONDARY
                }
                shadowColor={
                  currentTier.id === "free" ? "purple-500" : "gray-500"
                }
                className="text-sm"
              >
                {currentTier.id === "free" ? (
                  <>
                    <Crown className="w-4 h-4 mr-1" />
                    Upgrade
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-1" />
                    Billing
                  </>
                )}
              </GradientButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Connection Status */}
        {!connectedWallet && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Wallet className="w-6 h-6 text-orange-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Connect Your Wallet
                    </h3>
                    <p className="text-gray-400">
                      Connect your wallet to view portfolio analytics
                    </p>
                  </div>
                </div>
                <GradientButton
                  gradient={GRADIENTS.PRIMARY}
                  shadowColor="purple-500"
                >
                  Connect Wallet
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-4 mb-6 bg-red-900/20 border-red-800/30">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <div className="font-medium text-red-300">
                    Error Loading Data
                  </div>
                  <div className="text-sm text-red-400">{error}</div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && !portfolioData.length && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="glass-morphism rounded-3xl p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-700 rounded mb-4" />
                <div className="h-8 bg-gray-700 rounded mb-2" />
                <div className="h-4 bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Main Content */}
        {connectedWallet && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Portfolio Overview */}
            <div className="lg:col-span-2">
              <WalletPortfolio
                onAnalyticsClick={() => setShowAnalytics(true)}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Featured Strategies */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  Featured Strategies
                </h3>

                <div className="space-y-3">
                  {featuredStrategies.slice(0, 3).map((strategy, index) => (
                    <div key={index} className="p-3 glass-morphism rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-white">
                          {strategy.name || `Strategy ${index + 1}`}
                        </div>
                        <div className="text-sm text-green-400">
                          +{(15 + index * 2).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {strategy.description ||
                          "DeFi yield optimization strategy"}
                      </div>
                    </div>
                  ))}
                </div>

                <SubscriptionGate
                  feature="Strategy recommendations"
                  showUpgradePrompt={false}
                  fallback={
                    <div className="mt-4 p-3 bg-purple-900/20 border border-purple-800/30 rounded-lg text-center">
                      <div className="text-sm text-purple-300 mb-2">
                        Get Personalized Strategies
                      </div>
                      <button
                        onClick={() => setShowPricing(true)}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Upgrade to Pro →
                      </button>
                    </div>
                  }
                />
              </GlassCard>

              {/* Top Pools */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Top Yield Pools
                </h3>

                <div className="space-y-3">
                  {topPools.slice(0, 4).map((pool, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <div className="text-sm font-medium text-white">
                          {pool.name || `Pool ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-400">
                          {pool.protocol || "DeFi Protocol"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-400">
                          {(8 + index * 3).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">APR</div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Historical Data Teaser */}
              <HistoricalDataGate
                fallback={
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Historical Performance
                    </h3>

                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-sm text-gray-300 mb-2">
                        1+ Year of Data Available
                      </div>
                      <div className="text-xs text-gray-500 mb-4">
                        Track long-term performance trends
                      </div>
                      <button
                        onClick={() => setShowPricing(true)}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Upgrade to access →
                      </button>
                    </div>
                  </GlassCard>
                }
              >
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Historical Performance
                  </h3>
                  {/* Full historical data component would go here */}
                  <div className="text-sm text-gray-400">
                    Historical data visualization available for Pro users
                  </div>
                </GlassCard>
              </HistoricalDataGate>
            </div>
          </div>
        )}

        {/* Upgrade Prompt for Free Users */}
        {currentTier.id === "free" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-8"
          >
            <GlassCard className="p-8 text-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-700/30">
              <Crown className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Ready for More?
              </h3>
              <p className="text-gray-300 mb-6 max-w-md mx-auto">
                Upgrade to Pro for real-time data, advanced analytics, and
                unlimited portfolio tracking.
              </p>
              <GradientButton
                onClick={() => setShowPricing(true)}
                gradient={GRADIENTS.PRIMARY}
                shadowColor="purple-500"
                className="px-8"
              >
                View Pricing Plans
              </GradientButton>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}

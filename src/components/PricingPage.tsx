"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Crown,
  Zap,
  Shield,
  TrendingUp,
  Wallet,
  CreditCard,
  X,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import {
  SUBSCRIPTION_TIERS,
  PAYMENT_METHODS,
  CHAIN_CONFIGS,
  PaymentMethod,
  SubscriptionTier,
} from "../types/subscription";
import { useSubscription } from "../hooks/useSubscription";
import { GlassCard, GradientButton } from "./ui";
import { GRADIENTS } from "../styles/design-tokens";

interface PricingPageProps {
  onClose?: () => void;
}

export function PricingPage({}: PricingPageProps) {
  const { subscriptionStatus, currentTier, upgrade, isLoading, error } =
    useSubscription();

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(
    null
  );
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(
    null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier.id === "free") return;

    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedTier || !selectedPayment) return;

    try {
      await upgrade(selectedTier.id, selectedPayment);
      setShowPaymentModal(false);
      setSelectedTier(null);
      setSelectedPayment(null);
    } catch {
      // Payment failed: err
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case "free":
        return <Shield className="w-6 h-6" />;
      case "pro":
        return <TrendingUp className="w-6 h-6" />;
      case "enterprise":
        return <Crown className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  const getTierGradient = (tierId: string) => {
    switch (tierId) {
      case "free":
        return "from-gray-600 to-gray-700";
      case "pro":
        return "from-purple-600 to-blue-600";
      case "enterprise":
        return "from-yellow-500 to-orange-600";
      default:
        return "from-purple-600 to-blue-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock advanced DeFi analytics and portfolio insights with our
            crypto-powered subscription plans
          </p>

          {/* Current Subscription Status */}
          {subscriptionStatus && (
            <div className="mt-6 inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-900/30 border border-purple-700/50">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-purple-300">
                Current Plan:{" "}
                <span className="font-semibold">{currentTier.name}</span>
              </span>
            </div>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {SUBSCRIPTION_TIERS.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${tier.popular ? "scale-105" : ""}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-sm font-semibold text-white">
                    Most Popular
                  </div>
                </div>
              )}

              <GlassCard
                className={`h-full p-8 ${tier.popular ? "border-purple-500/50" : ""}`}
              >
                <div className="text-center mb-6">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${getTierGradient(tier.id)} flex items-center justify-center mx-auto mb-4`}
                  >
                    {getTierIcon(tier.id)}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-gray-400 mb-4">{tier.description}</p>

                  <div className="mb-6">
                    {tier.price === 0 ? (
                      <span className="text-4xl font-bold text-white">
                        Free
                      </span>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold text-white">
                          ${tier.price}
                        </span>
                        <span className="text-gray-400">/month</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="flex items-start space-x-3"
                    >
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                <div className="border-t border-gray-800 pt-6 mb-8">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">
                    LIMITS
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Wallet Addresses</span>
                      <span className="text-white">
                        {tier.limits.walletAddresses === -1
                          ? "Unlimited"
                          : tier.limits.walletAddresses}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">API Calls/Month</span>
                      <span className="text-white">
                        {tier.limits.apiCalls.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Data Refresh</span>
                      <span className="text-white">
                        {tier.limits.dataRefreshRate >= 1440
                          ? "Daily"
                          : tier.limits.dataRefreshRate >= 60
                            ? `${tier.limits.dataRefreshRate / 60}h`
                            : `${tier.limits.dataRefreshRate}min`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <GradientButton
                  onClick={() => handleUpgrade(tier)}
                  disabled={currentTier.id === tier.id || isLoading}
                  gradient={
                    tier.popular ? GRADIENTS.PRIMARY : GRADIENTS.SECONDARY
                  }
                  shadowColor={tier.popular ? "purple-500" : "gray-500"}
                  className="w-full"
                >
                  {currentTier.id === tier.id ? (
                    "Current Plan"
                  ) : tier.price === 0 ? (
                    "Get Started"
                  ) : (
                    <>
                      Upgrade to {tier.name}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </GradientButton>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Payment Methods Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-8">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Wallet className="w-6 h-6 mr-3 text-purple-400" />
              Supported Payment Methods
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {PAYMENT_METHODS.slice(0, 4).map(method => (
                <div
                  key={method.id}
                  className="flex items-center space-x-3 p-3 glass-morphism rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {method.symbol.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {method.symbol}
                    </div>
                    <div className="text-xs text-gray-400">
                      {
                        CHAIN_CONFIGS[
                          method.chainId as keyof typeof CHAIN_CONFIGS
                        ]?.name
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start space-x-3 p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-300 mb-1">
                  Crypto Payments Only
                </div>
                <div className="text-xs text-gray-400">
                  We accept USDC, USDT, and ETH on Ethereum, Arbitrum, Base, and
                  Polygon networks. All payments are processed instantly via
                  smart contracts.
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Payment Modal */}
        {showPaymentModal && selectedTier && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Upgrade to {selectedTier.name}
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="mb-6">
                <div className="text-center p-4 glass-morphism rounded-lg mb-4">
                  <div className="text-2xl font-bold text-white">
                    ${selectedTier.price}
                  </div>
                  <div className="text-sm text-gray-400">per month</div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  SELECT PAYMENT METHOD
                </h4>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 ${
                        selectedPayment?.id === method.id
                          ? "border-purple-500 bg-purple-900/20"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-sm font-semibold">
                              {method.symbol.substring(0, 2)}
                            </span>
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium text-white">
                              {method.symbol}
                            </div>
                            <div className="text-xs text-gray-400">
                              {
                                CHAIN_CONFIGS[
                                  method.chainId as keyof typeof CHAIN_CONFIGS
                                ]?.name
                              }
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-300">
                          {method.isStablecoin
                            ? `$${selectedTier.price}`
                            : "~$" + selectedTier.price}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-300">{error}</span>
                  </div>
                </div>
              )}

              <GradientButton
                onClick={handlePayment}
                disabled={!selectedPayment || isLoading}
                gradient={GRADIENTS.PRIMARY}
                shadowColor="purple-500"
                className="w-full"
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay with {selectedPayment?.symbol}
                  </>
                )}
              </GradientButton>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

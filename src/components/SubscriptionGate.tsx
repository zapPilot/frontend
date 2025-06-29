"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Crown,
  TrendingUp,
  Clock,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { useSubscription } from "../hooks/useSubscription";
import { PricingPage } from "./PricingPage";
import { GlassCard, GradientButton } from "./ui";
import { GRADIENTS } from "../styles/design-tokens";

interface SubscriptionGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function SubscriptionGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: SubscriptionGateProps) {
  const { canAccessFeature, currentTier, subscriptionStatus } =
    useSubscription();
  const [showPricing, setShowPricing] = useState(false);

  const hasAccess = canAccessFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const getFeatureRequirement = (feature: string): string => {
    if (feature.includes("Real-time") || feature.includes("real-time")) {
      return "Pro";
    }
    if (feature.includes("API") || feature.includes("Custom")) {
      return "Enterprise";
    }
    if (feature.includes("Advanced") || feature.includes("1-year")) {
      return "Pro";
    }
    return "Pro";
  };

  const requiredTier = getFeatureRequirement(feature);

  if (showPricing) {
    return <PricingPage onClose={() => setShowPricing(false)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full"
    >
      <GlassCard className="p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
          {requiredTier === "Enterprise" ? (
            <Crown className="w-8 h-8 text-white" />
          ) : (
            <TrendingUp className="w-8 h-8 text-white" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-white mb-4">
          {requiredTier} Feature
        </h3>

        <p className="text-gray-300 mb-6 max-w-md mx-auto">
          This feature requires a{" "}
          <span className="font-semibold text-purple-400">{requiredTier}</span>{" "}
          subscription. Upgrade now to unlock {feature.toLowerCase()} and more
          advanced analytics.
        </p>

        {/* Feature Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 glass-morphism rounded-lg">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-sm font-medium text-white mb-1">
              Real-time Updates
            </div>
            <div className="text-xs text-gray-400">
              Live data refresh every 5 minutes
            </div>
          </div>

          <div className="p-4 glass-morphism rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-sm font-medium text-white mb-1">
              Advanced Analytics
            </div>
            <div className="text-xs text-gray-400">
              Risk metrics, performance attribution
            </div>
          </div>

          <div className="p-4 glass-morphism rounded-lg">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-sm font-medium text-white mb-1">
              Historical Data
            </div>
            <div className="text-xs text-gray-400">
              1+ year of portfolio history
            </div>
          </div>
        </div>

        {/* Current Plan Status */}
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              Current Plan:{" "}
              <span className="font-semibold text-white">
                {currentTier.name}
              </span>
            </span>
          </div>

          {subscriptionStatus?.expiresAt && (
            <div className="text-xs text-gray-500">
              {subscriptionStatus.isActive ? "Expires" : "Expired"} on{" "}
              {subscriptionStatus.expiresAt.toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Rate Limit Warning */}
        {currentTier.id === "free" && (
          <div className="mb-6 p-3 bg-orange-900/20 border border-orange-800/30 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300">
                Free tier: Daily updates only
              </span>
            </div>
          </div>
        )}

        {/* Upgrade Button */}
        <GradientButton
          onClick={() => setShowPricing(true)}
          gradient={GRADIENTS.PRIMARY}
          shadowColor="purple-500"
          className="px-8"
        >
          Upgrade to {requiredTier}
        </GradientButton>

        {/* Pricing Preview */}
        <div className="mt-4 text-sm text-gray-400">
          Starting at{" "}
          <span className="font-semibold text-white">$50/month</span> • Pay with
          crypto
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Specialized gates for common features
export function RealtimeDataGate({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionGate feature="Real-time data refresh">
      {children}
    </SubscriptionGate>
  );
}

export function AdvancedAnalyticsGate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionGate feature="Advanced portfolio analytics">
      {children}
    </SubscriptionGate>
  );
}

export function HistoricalDataGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <SubscriptionGate feature="1-year historical data" fallback={fallback}>
      {children}
    </SubscriptionGate>
  );
}

export function APIAccessGate({ children }: { children: React.ReactNode }) {
  return <SubscriptionGate feature="API access">{children}</SubscriptionGate>;
}

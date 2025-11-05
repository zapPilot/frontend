"use client";

import { motion } from "framer-motion";
import { BarChart3, Shield, TrendingUp, Wallet } from "lucide-react";
import React from "react";

import { fadeInUp, SMOOTH_TRANSITION } from "@/lib/animationVariants";

import { EmptyStateCard } from "./EmptyStateCard";

interface WalletConnectionPromptProps {
  title?: string;
  description?: string;
  showFeatures?: boolean;
  className?: string;
}

export const WalletConnectionPrompt = React.memo<WalletConnectionPromptProps>(
  ({
    title = "Your DeFi Portfolio Awaits",
    description = "Connect your wallet to track assets, view yield opportunities, and optimize your portfolio across multiple protocols.",
    showFeatures = true,
    className = "",
  }) => {
    const features = [
      {
        icon: <BarChart3 className="w-5 h-5" />,
        title: "Multi-Chain Tracking",
        description: "Track assets across 20+ blockchains",
      },
      {
        icon: <TrendingUp className="w-5 h-5" />,
        title: "Yield Optimization",
        description: "Discover best APR opportunities",
      },
      {
        icon: <Shield className="w-5 h-5" />,
        title: "Portfolio Analytics",
        description: "Comprehensive performance insights",
      },
    ];

    return (
      <div className={className}>
        <EmptyStateCard
          icon={<Wallet className="w-8 h-8 text-purple-400" />}
          title={title}
          description={description}
        >
          {showFeatures && (
            <motion.div
              {...fadeInUp}
              transition={{ ...SMOOTH_TRANSITION, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  {...fadeInUp}
                  transition={{
                    ...SMOOTH_TRANSITION,
                    delay: 0.3 + index * 0.1,
                  }}
                  className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-900/20 backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      {feature.icon}
                    </div>
                  </div>
                  <h4 className="font-semibold text-white text-xs sm:text-sm mb-1 sm:mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </EmptyStateCard>
      </div>
    );
  }
);

WalletConnectionPrompt.displayName = "WalletConnectionPrompt";

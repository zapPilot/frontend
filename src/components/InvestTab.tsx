"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Star, Zap } from "lucide-react";
import {
  mockInvestmentOpportunities,
  mockInvestmentStats,
} from "../data/mockInvestments";
import { getRiskLevelClasses } from "../lib/utils";
import { InvestmentOpportunity } from "../types/investment";

interface InvestTabProps {
  onInvestClick?: (strategy: InvestmentOpportunity) => void;
}

export function InvestTab({ onInvestClick }: InvestTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Investment Opportunities
        </h1>
        <p className="text-gray-400">
          Discover curated DeFi strategies powered by intent-based execution
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockInvestmentStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-morphism rounded-2xl p-6 border border-gray-800"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-blue-600/20">
                <stat.icon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Investment Cards */}
      <div className="space-y-4">
        {mockInvestmentOpportunities.map((opportunity, index) => (
          <motion.div
            key={opportunity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-morphism rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${opportunity.color} flex items-center justify-center`}
                >
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {opportunity.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {opportunity.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs px-2 py-1 rounded-lg bg-gray-800 text-gray-300">
                      {opportunity.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-lg ${getRiskLevelClasses(opportunity.risk)}`}
                    >
                      {opportunity.risk} Risk
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {opportunity.apr}%
                </div>
                <div className="text-sm text-gray-400">APR</div>
                <div className="text-xs text-gray-500">
                  TVL: {opportunity.tvl}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Featured Strategy</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onInvestClick?.(opportunity)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:shadow-lg transition-all duration-300"
              >
                <span>Invest Now</span>
                <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Coming Soon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center glass-morphism rounded-2xl p-8 border border-gray-800 border-dashed"
      >
        <div className="text-gray-400 mb-4">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-medium">More Strategies Coming Soon</h3>
          <p className="text-sm">
            We&apos;re continuously adding new investment opportunities. Stay
            tuned!
          </p>
        </div>
      </motion.div>
    </div>
  );
}

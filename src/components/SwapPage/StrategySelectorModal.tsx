"use client";

import { motion } from "framer-motion";
import { X, Zap, Star } from "lucide-react";
import { InvestmentOpportunity } from "../../types/investment";

/**
 * Strategy Selector Modal
 *
 * A dedicated modal for selecting investment strategies/vaults.
 * Used in SwapPage when navigation context is 'zapIn' or 'zapOut'.
 *
 * Features:
 * - Shows strategy details (APR, risk, category, TVL)
 * - Context-aware titles and descriptions
 * - Enhanced visual design with animations
 * - Proper type safety for strategies
 */

interface StrategySelectorModalProps {
  strategies: InvestmentOpportunity[];
  onStrategySelect: (strategy: InvestmentOpportunity) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function StrategySelectorModal({
  strategies,
  onStrategySelect,
  onClose,
  title = "Select Strategy",
  description = "Choose a vault strategy to invest in",
}: StrategySelectorModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="strategy-selector-modal"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="max-w-md w-full glass-morphism rounded-2xl p-6 border border-gray-700"
        onClick={e => e.stopPropagation()}
        data-testid="strategy-selector-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
            data-testid="close-button"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Strategy List */}
        <div
          className="space-y-3 max-h-96 overflow-y-auto"
          data-testid="strategy-list"
        >
          {strategies.map(strategy => (
            <motion.button
              key={strategy.id}
              onClick={() => onStrategySelect(strategy)}
              className="w-full p-4 rounded-xl bg-gray-900/50 hover:bg-gray-900/70 transition-all duration-300 text-left border border-gray-700 hover:border-gray-600 cursor-pointer"
              data-testid={`strategy-option-${strategy.id}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-4">
                {/* Strategy Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${strategy.color} flex items-center justify-center flex-shrink-0`}
                >
                  <Zap className="w-6 h-6 text-white" />
                </div>

                {/* Strategy Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-white truncate">
                      {strategy.name}
                    </h4>
                    <div className="flex items-center space-x-2 ml-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-bold text-green-400">
                        {strategy.apr}%
                      </span>
                    </div>
                  </div>

                  <p
                    className="text-sm text-gray-400 mb-2 overflow-hidden"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {strategy.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">
                        {strategy.category}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          strategy.risk === "Low"
                            ? "bg-green-900/30 text-green-400"
                            : strategy.risk === "Medium"
                              ? "bg-yellow-900/30 text-yellow-400"
                              : "bg-red-900/30 text-red-400"
                        }`}
                      >
                        {strategy.risk} Risk
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      TVL: {strategy.tvl}
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Select a strategy to continue with your investment
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { OptimizeTab } from "./OptimizeTab";
import { GlassCard } from "../ui";

interface RebalanceOptimizationPanelProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

/**
 * Integrated optimization panel for the Rebalance tab
 *
 * Design Philosophy:
 * - Progressive disclosure: Basic rebalance first, advanced optimization on-demand
 * - Contextual activation: Optimization features only appear when requested
 * - Visual hierarchy: Clear separation between basic and advanced features
 * - DeFi UX pattern: Follow established Web3 interface conventions
 */
export function RebalanceOptimizationPanel({
  isEnabled,
  onToggle,
}: RebalanceOptimizationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand when optimization is enabled
  const handleToggle = (enabled: boolean) => {
    onToggle(enabled);
    if (enabled) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Optimization Toggle Control */}
      <GlassCard className="border-l-4 border-l-purple-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Advanced Portfolio Optimization
              </h4>
              <p className="text-xs text-gray-400">
                Dust conversion, gas optimization, and smart rebalancing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Toggle Switch */}
            <button
              onClick={() => handleToggle(!isEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isEnabled ? "bg-purple-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>

            {/* Expand/Collapse Button (only when enabled) */}
            {isEnabled && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats (when enabled but collapsed) */}
        {isEnabled && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-700/50"
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-400">Dust Tokens</div>
                <div className="text-sm font-semibold text-purple-400">12</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Est. Value</div>
                <div className="text-sm font-semibold text-green-400">
                  $24.50
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Gas Savings</div>
                <div className="text-sm font-semibold text-blue-400">
                  0.003 ETH
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </GlassCard>

      {/* Expanded Optimization Interface */}
      <AnimatePresence>
        {isEnabled && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold gradient-text">
                Portfolio Optimization Suite
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Advanced tools for gas-efficient portfolio management
              </p>
            </div>

            {/* Integrated OptimizeTab */}
            <OptimizeTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowRightLeft, RotateCcw, Zap } from "lucide-react";
import { OperationMode } from "../PortfolioAllocation/types";

interface TabNavigationProps {
  activeOperationMode: OperationMode;
  onOperationModeChange: (mode: OperationMode) => void;
}

// Single-layer: Operation Modes only
const operationModes = [
  {
    id: "zapIn" as OperationMode,
    label: "Zap In",
    description: "Token → Portfolio",
    icon: Zap,
  },
  {
    id: "zapOut" as OperationMode,
    label: "Zap Out",
    description: "Portfolio → Token",
    icon: ArrowRightLeft,
  },
  {
    id: "rebalance" as OperationMode,
    label: "Rebalance",
    description: "Optimize Portfolio",
    icon: RotateCcw,
  },
];

export function TabNavigation({
  activeOperationMode,
  onOperationModeChange,
}: TabNavigationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-morphism rounded-2xl p-4 border border-gray-800"
      data-testid="tab-navigation"
    >
      {/* Single-Layer Navigation */}
      <div className="grid grid-cols-3 gap-3">
        {operationModes.map(mode => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onOperationModeChange(mode.id)}
              data-testid={`operation-${mode.id}`}
              className={`p-4 rounded-xl transition-all duration-300 flex flex-col items-center justify-center space-y-2 cursor-pointer border ${
                activeOperationMode === mode.id
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg border-purple-500/50"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50"
              }`}
            >
              <Icon className="w-6 h-6" />
              <div className="text-center">
                <div className="text-sm font-semibold">{mode.label}</div>
                <div className="text-xs opacity-80 hidden sm:block mt-1">
                  {mode.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

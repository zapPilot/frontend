"use client";

import { motion } from "framer-motion";
import { ArrowRightLeft, RotateCcw, Zap } from "lucide-react";

import { GRADIENTS } from "@/constants/design-system";

import { OperationMode } from "../PortfolioAllocation/types";

interface TabNavigationProps {
  activeOperationMode: OperationMode;
  onOperationModeChange: (mode: OperationMode) => void;
}

// Simplified single-layer navigation
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
    label: "Optimize",
    description: "Rebalance & Optimize Portfolio",
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
      className="glass-morphism rounded-2xl p-3 border border-gray-800"
      data-testid="tab-navigation"
    >
      <div>
        <h3 className="text-xs font-medium text-gray-400 mb-2 px-1">
          Operation Mode
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {operationModes.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => onOperationModeChange(mode.id)}
                data-testid={`operation-${mode.id}`}
                className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                  activeOperationMode === mode.id
                    ? `bg-gradient-to-r ${GRADIENTS.PRIMARY} text-white shadow-lg`
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="text-center">
                  <div className="text-sm font-medium">{mode.label}</div>
                  <div className="text-xs opacity-75 hidden sm:block">
                    {mode.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

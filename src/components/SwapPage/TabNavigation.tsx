"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  PieChart as PieChartIcon,
  RotateCcw,
  Settings,
  Zap,
} from "lucide-react";
import { OperationMode } from "../PortfolioAllocation/types";

// New hierarchical type system
export type SubTabType = "allocation" | "performance" | "details" | "optimize";

interface TabNavigationProps {
  activeOperationMode: OperationMode;
  activeSubTab: SubTabType;
  onOperationModeChange: (mode: OperationMode) => void;
  onSubTabChange: (tab: SubTabType) => void;
}

// Parent level: Operation Modes
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

// Child level: SubTabs
const subTabs = [
  { id: "allocation" as SubTabType, label: "Allocation", icon: PieChartIcon },
  { id: "performance" as SubTabType, label: "Performance", icon: BarChart3 },
  { id: "details" as SubTabType, label: "Details", icon: Activity },
  { id: "optimize" as SubTabType, label: "Optimize", icon: Settings },
];

export function TabNavigation({
  activeOperationMode,
  activeSubTab,
  onOperationModeChange,
  onSubTabChange,
}: TabNavigationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-morphism rounded-2xl p-3 border border-gray-800 space-y-4"
      data-testid="tab-navigation"
    >
      {/* Parent Level: Operation Modes */}
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
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
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

      {/* Child Level: SubTabs */}
      <div>
        <h3 className="text-xs font-medium text-gray-400 mb-2 px-1">View</h3>
        <div className="grid grid-cols-4 gap-1">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onSubTabChange(tab.id)}
                data-testid={`subtab-${tab.id}`}
                className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1 cursor-pointer ${
                  activeSubTab === tab.id
                    ? "bg-gray-700 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="text-xs font-medium hidden sm:inline">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

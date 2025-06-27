"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
} from "lucide-react";

export type TabType = "swap" | "allocation" | "performance" | "details";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "swap" as TabType, label: "Swap", icon: Zap },
  { id: "allocation" as TabType, label: "Allocation", icon: PieChartIcon },
  { id: "performance" as TabType, label: "Performance", icon: BarChart3 },
  { id: "details" as TabType, label: "Details", icon: Activity },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-morphism rounded-2xl p-2 border border-gray-800"
      data-testid="tab-navigation"
    >
      <div className="grid grid-cols-4 gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              data-testid={`tab-${tab.id}`}
              className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

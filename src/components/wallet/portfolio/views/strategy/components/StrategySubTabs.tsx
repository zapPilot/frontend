"use client";

import { FlaskConical, Lightbulb } from "lucide-react";

import { cn } from "@/lib/ui/classNames";
import type { StrategySubTab } from "@/types/portfolio";

interface StrategySubTabsProps {
  activeSubTab: StrategySubTab;
  onSubTabChange: (tab: StrategySubTab) => void;
}

const SUB_TABS: { id: StrategySubTab; label: string; icon: React.ReactNode }[] =
  [
    {
      id: "suggestion",
      label: "Today's Suggestion",
      icon: <Lightbulb className="w-4 h-4" />,
    },
    {
      id: "backtesting",
      label: "Backtesting Playground",
      icon: <FlaskConical className="w-4 h-4" />,
    },
  ];

export function StrategySubTabs({
  activeSubTab,
  onSubTabChange,
}: StrategySubTabsProps) {
  return (
    <div className="flex gap-2 p-1 bg-gray-800/50 rounded-lg w-fit">
      {SUB_TABS.map(tab => (
        <button
          key={tab.id}
          data-testid={`strategy-subtab-${tab.id}`}
          onClick={() => onSubTabChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
            activeSubTab === tab.id
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          )}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

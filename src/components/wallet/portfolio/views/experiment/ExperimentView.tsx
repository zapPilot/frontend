"use client";

import { type JSX, useState } from "react";

import { BacktestingView } from "../BacktestingView";
import { TradingView } from "./trading/TradingView";

interface ExperimentViewProps {
  userId: string | undefined;
}

type SubTab = "trading" | "backtesting";

interface SubTabConfig {
  id: SubTab;
  label: string;
}

const SUB_TABS: readonly SubTabConfig[] = [
  { id: "trading", label: "trading" },
  { id: "backtesting", label: "backtesting" },
];

const ACTIVE_TAB_CLASS_NAME = "text-white";
const INACTIVE_TAB_CLASS_NAME = "text-gray-500 hover:text-gray-300";

function getSubTabClassName(isActive: boolean): string {
  let tabStateClassName = INACTIVE_TAB_CLASS_NAME;

  if (isActive) {
    tabStateClassName = ACTIVE_TAB_CLASS_NAME;
  }

  return `pb-4 text-sm font-medium transition-colors relative ${tabStateClassName}`;
}

function renderActiveSubTab(
  activeSubTab: SubTab,
  userId: string | undefined
): JSX.Element {
  switch (activeSubTab) {
    case "trading":
      return <TradingView userId={userId} />;
    case "backtesting":
      return <BacktestingView />;
  }
}

export function ExperimentView({ userId }: ExperimentViewProps): JSX.Element {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("trading");

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-800">
        <div className="flex items-center gap-8">
          {SUB_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveSubTab(id)}
              className={getSubTabClassName(activeSubTab === id)}
            >
              <span className="capitalize">{label}</span>
              {activeSubTab === id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderActiveSubTab(activeSubTab, userId)}
      </div>
    </div>
  );
}

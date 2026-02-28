"use client";

import { type JSX, useState } from "react";

import { BacktestingView } from "../BacktestingView";
import { MarketDashboardView } from "./market/MarketDashboardView";
import { TradingView } from "./trading/TradingView";

interface InvestViewProps {
  userId: string | undefined;
}

const SUB_TABS = [
  { id: "market", label: "market data" },
  { id: "trading", label: "trading" },
  { id: "backtesting", label: "backtesting" },
] as const;

type SubTab = (typeof SUB_TABS)[number]["id"];

function getSubTabClassName(isActive: boolean): string {
  const state = isActive ? "text-white" : "text-gray-500 hover:text-gray-300";
  return `pb-4 text-sm font-medium transition-colors relative ${state}`;
}

function renderActiveSubTab(
  activeSubTab: SubTab,
  userId: string | undefined
): JSX.Element {
  switch (activeSubTab) {
    case "market":
      return <MarketDashboardView />;
    case "trading":
      return <TradingView userId={userId} />;
    case "backtesting":
      return <BacktestingView />;
  }
}

export function InvestView({ userId }: InvestViewProps): JSX.Element {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("market");

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

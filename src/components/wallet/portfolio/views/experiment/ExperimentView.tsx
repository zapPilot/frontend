"use client";

import { useState } from "react";

import { BacktestingView } from "../BacktestingView";
import { TradingView } from "./trading/TradingView";

interface ExperimentViewProps {
  userId: string | undefined;
}

type SubTab = "trading" | "backtesting";

export function ExperimentView({ userId }: ExperimentViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("trading");

  return (
    <div className="space-y-8">
      {/* Main Tab Navigation */}
      <div className="border-b border-gray-800">
        <div className="flex items-center gap-8">
          {(["trading", "backtesting"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`
                pb-4 text-sm font-medium transition-colors relative
                ${
                  activeSubTab === tab
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }
              `}
            >
              <span className="capitalize">{tab}</span>
              {activeSubTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeSubTab === "trading" && <TradingView userId={userId} />}
        {activeSubTab === "backtesting" && <BacktestingView />}
      </div>
    </div>
  );
}

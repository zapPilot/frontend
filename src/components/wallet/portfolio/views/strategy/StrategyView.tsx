"use client";

import { useState } from "react";

import type { StrategySubTab } from "@/types/portfolio";

import { BacktestingPlayground } from "./components/backtesting/BacktestingPlayground";
import { StrategySubTabs } from "./components/StrategySubTabs";
import { SuggestionView } from "./components/suggestion/SuggestionView";

interface StrategyViewProps {
  userId: string | undefined;
}

/**
 * Main Strategy view component with sub-tab routing.
 *
 * Manages navigation between:
 * - "Today's Suggestion" - Regime-aware allocation recommendations
 * - "Backtesting Playground" - Historical strategy simulation
 *
 * @param userId - The connected wallet address
 */
export function StrategyView({ userId }: StrategyViewProps) {
  const [activeSubTab, setActiveSubTab] =
    useState<StrategySubTab>("suggestion");

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <StrategySubTabs
        activeSubTab={activeSubTab}
        onSubTabChange={setActiveSubTab}
      />

      {/* Content based on active sub-tab */}
      {activeSubTab === "suggestion" && <SuggestionView userId={userId} />}

      {activeSubTab === "backtesting" && <BacktestingPlayground />}
    </div>
  );
}

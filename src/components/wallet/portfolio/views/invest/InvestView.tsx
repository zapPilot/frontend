"use client";

import { type JSX } from "react";

import { INVEST_SUB_TABS } from "@/components/wallet/portfolio/components/navigation";
import type { InvestSubTab, MarketSection } from "@/types";

import { BacktestingView } from "../BacktestingView";
import { ConfigManagerView } from "./configManager";
import { MarketDashboardView } from "./market/MarketDashboardView";
import { TradingView } from "./trading/TradingView";

interface InvestViewProps {
  userId: string | undefined;
  activeSubTab?: InvestSubTab;
  activeMarketSection?: MarketSection;
  onSubTabChange?: (subTab: InvestSubTab) => void;
  onMarketSectionChange?: (section: MarketSection) => void;
}

const noop = (): void => {
  /* no-op */
};

function getSubTabClassName(isActive: boolean): string {
  const state = isActive ? "text-white" : "text-gray-500 hover:text-gray-300";
  return `pb-4 text-sm font-medium transition-colors relative ${state}`;
}

function renderActiveSubTab(
  activeSubTab: InvestSubTab,
  userId: string | undefined,
  activeMarketSection: MarketSection,
  onMarketSectionChange: (section: MarketSection) => void
): JSX.Element {
  switch (activeSubTab) {
    case "trading":
      return <TradingView userId={userId} />;
    case "backtesting":
      return <BacktestingView />;
    case "market":
      return (
        <MarketDashboardView
          activeSection={activeMarketSection}
          onSectionChange={onMarketSectionChange}
        />
      );
    case "config-manager":
      return <ConfigManagerView />;
  }
}

export function InvestView({
  userId,
  activeSubTab = "trading",
  activeMarketSection = "overview",
  onSubTabChange = noop,
  onMarketSectionChange = noop,
}: InvestViewProps): JSX.Element {
  return (
    <div className="space-y-8">
      <div className="border-b border-gray-800">
        <div className="flex items-center gap-8">
          {INVEST_SUB_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onSubTabChange(id)}
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
        {renderActiveSubTab(
          activeSubTab,
          userId,
          activeMarketSection,
          onMarketSectionChange
        )}
      </div>
    </div>
  );
}

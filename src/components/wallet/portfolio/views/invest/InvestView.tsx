"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { type JSX } from "react";

import { INVEST_SUB_TABS } from "@/components/wallet/portfolio/components/navigation";
import type { InvestSubTab, MarketSection } from "@/types";

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

function InvestContentLoadingState(): JSX.Element {
  return (
    <div
      className="min-h-[20rem] rounded-3xl border border-gray-800/60 bg-gray-900/40 flex items-center justify-center"
      data-testid="invest-content-loading"
    >
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        Loading invest tools...
      </div>
    </div>
  );
}

const LazyTradingView = dynamic(async () => {
  const mod = await import("./trading/TradingView");
  return mod.TradingView;
}, {
  loading: () => <InvestContentLoadingState />,
});

const LazyBacktestingView = dynamic(async () => {
  const mod = await import("../BacktestingView");
  return mod.BacktestingView;
}, {
  loading: () => <InvestContentLoadingState />,
});

const LazyMarketDashboardView = dynamic(async () => {
  const mod = await import("./market/MarketDashboardView");
  return mod.MarketDashboardView;
}, {
  loading: () => <InvestContentLoadingState />,
});

const LazyConfigManagerView = dynamic(async () => {
  const mod = await import("./configManager");
  return mod.ConfigManagerView;
}, {
  loading: () => <InvestContentLoadingState />,
});

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
      return <LazyTradingView userId={userId} />;
    case "backtesting":
      return <LazyBacktestingView />;
    case "market":
      return (
        <LazyMarketDashboardView
          activeSection={activeMarketSection}
          onSectionChange={onMarketSectionChange}
        />
      );
    case "config-manager":
      return <LazyConfigManagerView />;
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

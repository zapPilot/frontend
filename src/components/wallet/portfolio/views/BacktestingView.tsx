"use client";

import { Activity } from "lucide-react";
import { useEffect, useState } from "react";

import { BaseCard } from "@/components/ui/BaseCard";

import { BacktestConfiguration } from "./backtesting/components/BacktestConfiguration";
import { BacktestEmptyState } from "./backtesting/components/BacktestEmptyState";
import { BacktestLoadingState } from "./backtesting/components/BacktestLoadingState";
import {
  type BacktestingLayoutProps,
  VariationCards,
  VariationChartLead,
  VariationHUD,
  VariationMinimal,
  VariationSpotlight,
  VariationTicker,
} from "./backtesting/components/BacktestMetricsVariations/BacktestingLayouts";
import {
  BentoVariation,
  CockpitVariation,
  TerminalVariation,
} from "./backtesting/components/NewVariations";
import { useBacktestConfiguration } from "./backtesting/hooks/useBacktestConfiguration";
import { useBacktestResult } from "./backtesting/hooks/useBacktestResult";

type ViewMode =
  | "cards" | "chart-lead" | "minimal" | "hud" | "spotlight" | "ticker"
  | "cockpit" | "bento" | "terminal";

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "cards", label: "Cards" },
  { key: "chart-lead", label: "Chart Lead" },
  { key: "minimal", label: "Minimal" },
  { key: "hud", label: "HUD" },
  { key: "spotlight", label: "Spotlight" },
  { key: "ticker", label: "Ticker" },
  { key: "cockpit", label: "Cockpit" },
  { key: "bento", label: "Bento" },
  { key: "terminal", label: "Terminal" },
];

const VARIATION_COMPONENTS: Partial<Record<ViewMode, React.ComponentType<BacktestingLayoutProps>>> = {
  "cards": VariationCards,
  "chart-lead": VariationChartLead,
  "minimal": VariationMinimal,
  "hud": VariationHUD,
  "spotlight": VariationSpotlight,
  "ticker": VariationTicker,
};

const FULL_WIDTH_COMPONENTS: Partial<Record<ViewMode, React.ComponentType>> = {
  "cockpit": CockpitVariation,
  "bento": BentoVariation,
  "terminal": TerminalVariation,
};

const FULL_WIDTH_MODES = new Set<ViewMode>(["cockpit", "bento", "terminal"]);

export function BacktestingView() {
  const {
    backtestData,
    catalog,
    editorError,
    editorValue,
    error,
    isPending,
    lastSubmittedDays,
    setEditorError,
    handleRunBacktest,
    resetConfiguration,
    updateEditorValue,
  } = useBacktestConfiguration();

  const {
    chartData,
    yAxisDomain,
    summary,
    sortedStrategyIds,
    actualDays,
    daysDisplay,
  } = useBacktestResult(backtestData ?? null, lastSubmittedDays);

  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  useEffect(() => {
    handleRunBacktest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
            <Activity className="w-6 h-6 text-blue-400" />
            Strategy Simulator
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Compare Normal DCA vs Regime-Based Strategy performance over time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-gray-900/50 p-1 rounded-lg border border-gray-800/50">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === mode.key
                  ? "bg-blue-500/10 text-blue-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <BaseCard
          variant="glass"
          className="p-4 bg-rose-500/5 border-rose-500/20"
        >
          <div className="text-sm text-rose-400 font-medium">
            {error instanceof Error ? error.message : "Failed to run backtest"}
          </div>
        </BaseCard>
      )}

      {FULL_WIDTH_MODES.has(viewMode) ? (
        (() => {
          const FullWidthVariation = FULL_WIDTH_COMPONENTS[viewMode];
          return FullWidthVariation ? <FullWidthVariation /> : null;
        })()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <BaseCard
              variant="glass"
              className="h-full border-t-4 border-t-blue-500/50 p-6 bg-gray-900/40"
            >
              <BacktestConfiguration
                editorValue={editorValue}
                onEditorValueChange={updateEditorValue}
                editorError={editorError}
                setEditorError={setEditorError}
                onRun={handleRunBacktest}
                isPending={isPending}
                catalog={catalog}
                onReset={resetConfiguration}
              />
            </BaseCard>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {isPending ? (
              <BaseCard
                variant="glass"
                className="h-96 flex items-center justify-center bg-gray-900/40"
              >
                <BacktestLoadingState />
              </BaseCard>
            ) : !backtestData ? (
              <BaseCard variant="glass" className="p-8 bg-gray-900/40">
                <BacktestEmptyState />
              </BaseCard>
            ) : (
              (() => {
                const ActiveVariation = VARIATION_COMPONENTS[viewMode];
                return ActiveVariation ? (
                  <ActiveVariation
                    summary={summary}
                    sortedStrategyIds={sortedStrategyIds}
                    actualDays={actualDays}
                    daysDisplay={daysDisplay}
                    chartData={chartData}
                    yAxisDomain={yAxisDomain}
                  />
                ) : null;
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}

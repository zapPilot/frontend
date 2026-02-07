"use client";

import { Activity } from "lucide-react";
import { useEffect } from "react";

import { BaseCard } from "@/components/ui/BaseCard";

import { BacktestChart } from "./backtesting/components/BacktestChart";
import { BacktestConfiguration } from "./backtesting/components/BacktestConfiguration";
import { BacktestEmptyState } from "./backtesting/components/BacktestEmptyState";
import { BacktestLoadingState } from "./backtesting/components/BacktestLoadingState";
import { BacktestMetrics } from "./backtesting/components/BacktestMetrics";
import { useBacktestConfiguration } from "./backtesting/hooks/useBacktestConfiguration";
import { useBacktestResult } from "./backtesting/hooks/useBacktestResult";

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
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <BaseCard
                variant="glass"
                className="p-6 border-t-4 border-t-purple-500/50 bg-gray-900/40"
              >
                <BacktestMetrics
                  summary={summary}
                  sortedStrategyIds={sortedStrategyIds}
                  actualDays={actualDays}
                  daysDisplay={daysDisplay}
                />
              </BaseCard>

              <BaseCard
                variant="glass"
                className="p-6 border-t-4 border-t-emerald-500/50 bg-gray-900/40"
              >
                <BacktestChart
                  chartData={chartData}
                  sortedStrategyIds={sortedStrategyIds}
                  yAxisDomain={yAxisDomain}
                  actualDays={actualDays}
                />
              </BaseCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

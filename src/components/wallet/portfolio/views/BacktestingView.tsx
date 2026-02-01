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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            DCA Strategy Comparison
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Compare Normal DCA vs Regime-Based Strategy performance
          </p>
        </div>
      </div>

      {error && (
        <BaseCard
          variant="glass"
          className="p-4 bg-red-500/5 border-red-500/20"
        >
          <div className="text-sm text-red-400">
            {error instanceof Error ? error.message : "Failed to run backtest"}
          </div>
        </BaseCard>
      )}

      <div className="flex flex-col gap-6">
        <div className="w-full">
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
        </div>

        <div className="w-full space-y-6">
          {isPending ? (
            <BacktestLoadingState />
          ) : !backtestData ? (
            <BacktestEmptyState />
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <BacktestMetrics
                summary={summary}
                sortedStrategyIds={sortedStrategyIds}
                actualDays={actualDays}
                daysDisplay={daysDisplay}
              />
              <BacktestChart
                chartData={chartData}
                sortedStrategyIds={sortedStrategyIds}
                yAxisDomain={yAxisDomain}
                actualDays={actualDays}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

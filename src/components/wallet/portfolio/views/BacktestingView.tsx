"use client";

import { Activity, RefreshCw, Zap } from "lucide-react";
import { useEffect } from "react";

import { BaseCard } from "@/components/ui/BaseCard";

import { BacktestChart } from "./backtesting/components/BacktestChart";
import { BacktestConfiguration } from "./backtesting/components/BacktestConfiguration";
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
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl p-8 text-center text-gray-500 animate-pulse">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <RefreshCw className="relative w-16 h-16 text-blue-500 animate-spin" />
              </div>
              <h3 className="text-xl font-medium text-gray-200 mb-2">
                Running Backtest Simulation
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Processing historical market data and calculating strategy
                returns...
              </p>
            </div>
          ) : !backtestData ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl p-8 text-center text-gray-500">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <Zap className="relative w-16 h-16 text-gray-700 mb-6" />
              </div>
              <h3 className="text-xl font-medium text-gray-200 mb-2">
                Ready to Compare Strategies
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Click &quot;Run Backtest&quot; to see how the Zap Pilot
                regime-based strategy compares to normal DCA.
              </p>
            </div>
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

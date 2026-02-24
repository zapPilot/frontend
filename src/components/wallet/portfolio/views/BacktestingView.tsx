"use client";

import { Activity } from "lucide-react";
import { type ReactElement, useEffect } from "react";

import { BaseCard } from "@/components/ui/BaseCard";

import { BacktestEmptyState } from "./backtesting/components/BacktestEmptyState";
import { BacktestLoadingState } from "./backtesting/components/BacktestLoadingState";
import { BacktestTerminalDisplay } from "./backtesting/components/BacktestTerminalDisplay";
import { useBacktestConfiguration } from "./backtesting/hooks/useBacktestConfiguration";
import { useBacktestResult } from "./backtesting/hooks/useBacktestResult";

export function BacktestingView(): ReactElement {
  const {
    backtestData,
    editorValue,
    error,
    isPending,
    handleRunBacktest,
    updateEditorValue,
  } = useBacktestConfiguration();

  const { chartData, yAxisDomain, summary, sortedStrategyIds, actualDays } =
    useBacktestResult(backtestData ?? null);

  useEffect(() => {
    handleRunBacktest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let content: ReactElement;
  if (isPending) {
    content = (
      <BaseCard variant="glass" className="bg-gray-900/40">
        <BacktestLoadingState />
      </BaseCard>
    );
  } else if (!backtestData) {
    content = (
      <BaseCard variant="glass" className="p-8 bg-gray-900/40">
        <BacktestEmptyState />
      </BaseCard>
    );
  } else {
    content = (
      <BacktestTerminalDisplay
        summary={summary}
        sortedStrategyIds={sortedStrategyIds}
        actualDays={actualDays}
        chartData={chartData}
        yAxisDomain={yAxisDomain}
        isPending={isPending}
        onRun={handleRunBacktest}
        editorValue={editorValue}
        onEditorValueChange={updateEditorValue}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
          <Activity className="w-6 h-6 text-blue-400" />
          Strategy Simulator
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Compare Normal DCA vs Regime-Based Strategy performance over time
        </p>
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

      {content}
    </div>
  );
}

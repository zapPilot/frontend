"use client";

import { Activity, Play, RefreshCw, Zap } from "lucide-react";
import { useEffect } from "react";

import { BaseCard } from "@/components/ui/BaseCard";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";

import { AllocationConfigSelector } from "./backtesting/components/AllocationConfigSelector";
import { BacktestChart } from "./backtesting/components/BacktestChart";
import { BacktestMetrics } from "./backtesting/components/BacktestMetrics";
import { BacktestParamForm } from "./backtesting/components/BacktestParamForm";
import { useBacktestParams } from "./backtesting/hooks/useBacktestParams";
import { useBacktestResult } from "./backtesting/hooks/useBacktestResult";
import { getStrategyColor, getStrategyDisplayName } from "./backtesting/utils/strategyDisplay";

export function BacktestingView() {
  const {
    params,
    updateParam,
    resetParams,
    toggleAllocationConfig,
    showCustomBuilder,
    setShowCustomBuilder,
  } = useBacktestParams();

  const { mutate, data: backtestData, isPending, error } = useBacktestMutation();

  const {
    chartData,
    yAxisDomain,
    summary,
    sortedStrategyIds,
    actualDays,
    daysDisplay,
  } = useBacktestResult(backtestData ?? null, params.days);

  const handleRunBacktest = () => mutate(params);

  useEffect(() => {
    handleRunBacktest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSingleResults = backtestData != null;

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
        <button
          onClick={handleRunBacktest}
          disabled={isPending}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              Run Backtest
            </>
          )}
        </button>
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

      <BacktestParamForm
        params={params}
        onUpdate={updateParam}
        onReset={resetParams}
      />

      <AllocationConfigSelector
        allocationConfigs={params.allocation_configs}
        onToggle={toggleAllocationConfig}
        onAddCustom={config =>
          updateParam("allocation_configs", [
            ...(params.allocation_configs ?? []),
            config,
          ])
        }
        showCustomBuilder={showCustomBuilder}
        onShowCustomBuilder={setShowCustomBuilder}
      />

      {!backtestData && (
        <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl p-8 text-center text-gray-500">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
            <Zap className="relative w-16 h-16 text-gray-700 mb-6" />
          </div>
          <h3 className="text-xl font-medium text-gray-200 mb-2">
            Ready to Compare Strategies
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Click &quot;Run Backtest&quot; to see how the Zap Pilot regime-based
            strategy compares to normal DCA over the last 90 days.
          </p>
        </div>
      )}

      {showSingleResults && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <BacktestMetrics
            summary={summary}
            sortedStrategyIds={sortedStrategyIds}
            actualDays={actualDays}
            daysDisplay={daysDisplay}
            getStrategyDisplayName={getStrategyDisplayName}
            getStrategyColor={getStrategyColor}
          />
          <BacktestChart
            chartData={chartData}
            sortedStrategyIds={sortedStrategyIds}
            yAxisDomain={yAxisDomain}
            actualDays={actualDays}
            getStrategyDisplayName={getStrategyDisplayName}
            getStrategyColor={getStrategyColor}
          />
        </div>
      )}

    </div>
  );
}

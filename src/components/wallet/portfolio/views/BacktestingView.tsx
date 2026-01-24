"use client";

import { Activity, Play, RefreshCw, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { BaseCard } from "@/components/ui/BaseCard";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";

import { AllocationConfigSelector } from "./backtesting/components/AllocationConfigSelector";
import { BacktestChart } from "./backtesting/components/BacktestChart";
import { BacktestMetrics } from "./backtesting/components/BacktestMetrics";
import { BacktestParamForm } from "./backtesting/components/BacktestParamForm";
import { ScenarioChartCard } from "./backtesting/components/ScenarioChartCard";
import { ScenarioList } from "./backtesting/components/ScenarioList";
import { useBacktestParams } from "./backtesting/hooks/useBacktestParams";
import { useBacktestResult } from "./backtesting/hooks/useBacktestResult";
import { useBacktestScenarios } from "./backtesting/hooks/useBacktestScenarios";
import { getStrategyColor, getStrategyDisplayName } from "./backtesting/utils/strategyDisplay";

type Mode = "single" | "scenarios";

export function BacktestingView() {
  const [mode, setMode] = useState<Mode>("single");

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

  const {
    scenarios,
    results,
    runStatus,
    addScenario,
    removeScenario,
    runAll,
  } = useBacktestScenarios();

  const handleRunBacktest = () => mutate(params);

  useEffect(() => {
    if (mode === "single") {
      handleRunBacktest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSingle = mode === "single";
  const showSingleResults = isSingle && backtestData != null;
  const showScenarioResults = !isSingle && results.size > 0;

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
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex rounded-lg bg-gray-900/80 p-1 border border-gray-800">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isSingle
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Single run
            </button>
            <button
              type="button"
              onClick={() => setMode("scenarios")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                !isSingle
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Scenarios
            </button>
          </div>
          {isSingle ? (
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
          ) : null}
        </div>
      </div>

      {error && isSingle && (
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

      {!isSingle && (
        <ScenarioList
          scenarios={scenarios}
          currentRequest={params}
          runStatus={runStatus}
          onAdd={addScenario}
          onRemove={removeScenario}
          onRunAll={runAll}
        />
      )}

      {isSingle && !backtestData && (
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

      {showScenarioResults && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {scenarios.map(s => {
            const response = results.get(s.id);
            if (!response) return null;
            return (
              <ScenarioChartCard
                key={s.id}
                scenarioId={s.id}
                label={s.label}
                response={response}
                {...(s.request.days != null
                  ? { requestedDays: s.request.days }
                  : {})}
              />
            );
          })}
        </div>
      )}

      {!isSingle && scenarios.length > 0 && results.size === 0 && runStatus === "idle" && (
        <p className="text-sm text-gray-500 text-center py-8">
          Add scenarios above, then click &quot;Run all&quot; to compare.
        </p>
      )}

      {!isSingle && scenarios.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          Switch to Scenarios mode, then add scenarios from current params.
        </p>
      )}
    </div>
  );
}

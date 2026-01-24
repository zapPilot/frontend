"use client";

import type { BacktestResponse } from "@/types/backtesting";

import { getStrategyColor, getStrategyDisplayName } from "../utils/strategyDisplay";
import { useBacktestResult } from "../hooks/useBacktestResult";
import { BacktestChart } from "./BacktestChart";
import { BacktestMetrics } from "./BacktestMetrics";

export interface ScenarioChartCardProps {
  /** Unique id for chart gradient IDs (e.g. scenario id). */
  scenarioId: string;
  label: string;
  response: BacktestResponse;
  requestedDays?: number;
}

export function ScenarioChartCard({
  scenarioId,
  label,
  response,
  requestedDays,
}: ScenarioChartCardProps) {
  const {
    chartData,
    yAxisDomain,
    summary,
    sortedStrategyIds,
    actualDays,
    daysDisplay,
  } = useBacktestResult(response, requestedDays);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white">{label}</h3>
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
        chartIdPrefix={scenarioId}
      />
    </div>
  );
}

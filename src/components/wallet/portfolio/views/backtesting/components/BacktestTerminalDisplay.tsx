"use client";

import { useCallback, useMemo } from "react";

import type {
  BacktestResponse,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";

import {
  DEFAULT_DAYS,
  DMA_GATED_FGI_STRATEGY_ID,
  FIXED_PACING_ENGINE_ID,
} from "../constants";
import { getPrimaryStrategyId } from "../utils/chartHelpers";
import {
  parseConfigStrategyId,
  parseJsonField,
  updateConfigStrategy,
  updateJsonField,
} from "../utils/jsonConfigurationHelpers";
import { BacktestChart } from "./BacktestChart";
import { BacktestCommandBar } from "./BacktestCommandBar";
import { BacktestHeroMetrics } from "./BacktestHeroMetrics";
import { BacktestSecondaryMetrics } from "./BacktestSecondaryMetrics";
import {
  createHeroMetrics,
  createSecondaryMetrics,
} from "./backtestTerminalMetrics";
import type { TerminalDropdownOption } from "./TerminalDropdown";

export interface BacktestTerminalDisplayProps {
  /** Strategy summaries keyed by strategy_id */
  summary: { strategies: BacktestResponse["strategies"] } | null;
  /** Strategy IDs in display order */
  sortedStrategyIds: string[];
  /** Actual number of simulated days */
  actualDays: number;
  /** Chart timeline data */
  chartData: Record<string, unknown>[];
  /** Y-axis domain for chart */
  yAxisDomain: [number, number];
  /** Whether a backtest is currently running */
  isPending: boolean;
  /** Trigger a new backtest run */
  onRun: () => void;
  /** Raw JSON editor value (contains days / total_capital) */
  editorValue: string;
  /** Update the JSON editor value */
  onEditorValueChange: (v: string) => void;
  /** Strategy catalog for populating the dropdown */
  catalog: BacktestStrategyCatalogResponseV3 | null;
}

/**
 * Terminal-themed backtesting results display with a retro CLI aesthetic,
 * monospace text, ASCII bars, and a scan-line overlay.
 */
export function BacktestTerminalDisplay({
  summary,
  sortedStrategyIds,
  actualDays,
  chartData,
  yAxisDomain,
  isPending,
  onRun,
  editorValue,
  onEditorValueChange,
  catalog,
}: BacktestTerminalDisplayProps): React.ReactElement {
  const days = parseJsonField(editorValue, "days", DEFAULT_DAYS);
  const selectedStrategyId = parseConfigStrategyId(
    editorValue,
    DMA_GATED_FGI_STRATEGY_ID
  );

  const strategyOptions: TerminalDropdownOption[] = useMemo(() => {
    if (!catalog?.strategies?.length) {
      return [{ value: selectedStrategyId, label: selectedStrategyId }];
    }
    return catalog.strategies.map(s => ({
      value: s.strategy_id,
      label: s.display_name,
    }));
  }, [catalog, selectedStrategyId]);

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEditorValueChange(
      updateJsonField(editorValue, "days", Number(e.target.value))
    );
  };

  const handleStrategyChange = useCallback(
    (newStrategyId: string) => {
      const entry = catalog?.strategies.find(
        s => s.strategy_id === newStrategyId
      );
      const defaultParams = entry?.default_params;
      onEditorValueChange(
        updateConfigStrategy(editorValue, newStrategyId, defaultParams)
      );
    },
    [catalog, editorValue, onEditorValueChange]
  );

  const primaryId = getPrimaryStrategyId(sortedStrategyIds);
  const regime = primaryId ? summary?.strategies[primaryId] : undefined;

  const heroMetrics = useMemo(() => createHeroMetrics(regime), [regime]);
  const secondaryMetrics = useMemo(
    () => createSecondaryMetrics(regime),
    [regime]
  );

  return (
    <div className="font-mono bg-gray-950 rounded-2xl border border-gray-800 overflow-visible">
      <BacktestCommandBar
        days={days}
        onDaysChange={handleDaysChange}
        strategyOptions={strategyOptions}
        selectedStrategyId={selectedStrategyId}
        onStrategyChange={handleStrategyChange}
        pacingEngineId={FIXED_PACING_ENGINE_ID}
        isPending={isPending}
        onRun={onRun}
      />

      <BacktestHeroMetrics metrics={heroMetrics} />

      {chartData.length > 0 && (
        <div className="relative px-4 py-2">
          <BacktestChart
            chartData={chartData}
            sortedStrategyIds={sortedStrategyIds}
            yAxisDomain={yAxisDomain}
            actualDays={actualDays}
            chartIdPrefix="terminal"
          />
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(52,211,153,0.03) 2px, rgba(52,211,153,0.03) 4px)",
            }}
          />
        </div>
      )}

      <BacktestSecondaryMetrics hasData={!!regime} metrics={secondaryMetrics} />
    </div>
  );
}

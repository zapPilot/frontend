"use client";

import { useMemo } from "react";

import type { BacktestResponse } from "@/types/backtesting";

import {
  buildChartPoint,
  calculateActualDays,
  calculateYAxisDomain,
  sortStrategyIds,
} from "../utils/chartHelpers";

export interface UseBacktestResultReturn {
  chartData: Record<string, unknown>[];
  yAxisDomain: [number, number];
  summary: { strategies: BacktestResponse["strategies"] } | null;
  sortedStrategyIds: string[];
  actualDays: number;
}

export function useBacktestResult(
  response: BacktestResponse | null
): UseBacktestResultReturn {
  const actualDays = useMemo(
    () => (response ? calculateActualDays(response.timeline) : 0),
    [response]
  );

  const strategyIds = useMemo(
    () => (response ? Object.keys(response.strategies ?? {}) : []),
    [response]
  );

  const chartData = useMemo(() => {
    if (!response) {
      return [];
    }

    const spotAssetTracker: Record<string, "BTC" | "ETH" | null> = {};
    return response.timeline.map(point =>
      buildChartPoint(point, strategyIds, spotAssetTracker)
    );
  }, [response, strategyIds]);

  const yAxisDomain = useMemo(
    () => calculateYAxisDomain(chartData, strategyIds),
    [chartData, strategyIds]
  );

  const summary = response ? { strategies: response.strategies } : null;

  const sortedStrategyIds = useMemo(
    () => sortStrategyIds(strategyIds),
    [strategyIds]
  );

  return {
    chartData,
    yAxisDomain,
    summary,
    sortedStrategyIds,
    actualDays,
  };
}

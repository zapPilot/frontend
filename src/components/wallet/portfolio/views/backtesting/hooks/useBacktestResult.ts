"use client";

import { useMemo } from "react";

import type { BacktestResponse } from "@/types/backtesting";

import {
  buildChartPoint,
  calculateActualDays,
  calculateYAxisDomain,
  filterToActiveStrategies,
  sortStrategyIds,
} from "../utils/chartHelpers";
import type { SpotAssetSymbol } from "../utils/spotAssetDisplay";

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

  const sortedStrategyIds = useMemo(
    () =>
      response
        ? filterToActiveStrategies(
            sortStrategyIds(Object.keys(response.strategies ?? {}))
          )
        : [],
    [response]
  );

  const chartData = useMemo(() => {
    if (!response) {
      return [];
    }

    const spotAssetTracker: Record<string, SpotAssetSymbol | null> = {};
    return response.timeline.map(point =>
      buildChartPoint(point, sortedStrategyIds, spotAssetTracker)
    );
  }, [response, sortedStrategyIds]);

  const summary = response ? { strategies: response.strategies } : null;

  const yAxisDomain = useMemo(
    () => calculateYAxisDomain(chartData, sortedStrategyIds),
    [chartData, sortedStrategyIds]
  );

  return {
    chartData,
    yAxisDomain,
    summary,
    sortedStrategyIds,
    actualDays,
  };
}

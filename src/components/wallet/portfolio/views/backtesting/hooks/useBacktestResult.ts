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
  strategyIds: string[];
  chartData: Record<string, unknown>[];
  yAxisDomain: [number, number];
  summary: { strategies: BacktestResponse["strategies"] } | null;
  sortedStrategyIds: string[];
  actualDays: number;
}

export function useBacktestResult(
  response: BacktestResponse | null
): UseBacktestResultReturn {
  const strategyIds = useMemo(() => {
    if (!response) return [];
    return Object.keys(response.strategies ?? {});
  }, [response]);

  const chartData = useMemo(() => {
    if (!response) return [];
    return response.timeline.map(point => buildChartPoint(point, strategyIds));
  }, [response, strategyIds]);

  const yAxisDomain = useMemo((): [number, number] => {
    return calculateYAxisDomain(chartData, strategyIds);
  }, [chartData, strategyIds]);

  const summary = useMemo(() => {
    if (!response) return null;
    return { strategies: response.strategies };
  }, [response]);

  const actualDays = useMemo(() => {
    if (!response) return 0;
    return calculateActualDays(response.timeline);
  }, [response]);

  const sortedStrategyIds = useMemo(() => {
    return sortStrategyIds(strategyIds);
  }, [strategyIds]);

  return {
    strategyIds,
    chartData,
    yAxisDomain,
    summary,
    sortedStrategyIds,
    actualDays,
  };
}

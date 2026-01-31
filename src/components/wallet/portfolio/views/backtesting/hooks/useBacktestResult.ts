"use client";

import { useMemo } from "react";

import type { BacktestResponse } from "@/types/backtesting";

import { buildChartPoint,SIGNAL_FIELDS } from "../utils/chartHelpers";
import { getStrategyDisplayName } from "../utils/strategyDisplay";

export interface UseBacktestResultReturn {
  strategyIds: string[];
  chartData: Record<string, unknown>[];
  yAxisDomain: [number, number];
  summary: { strategies: BacktestResponse["strategies"] } | null;
  sortedStrategyIds: string[];
  actualDays: number;
  daysDisplay: string;
}

export function useBacktestResult(
  response: BacktestResponse | null,
  requestedDays?: number
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
    if (!chartData || chartData.length === 0) return [0, 1000];

    const allValues: number[] = [];
    for (const point of chartData) {
      for (const strategyId of strategyIds) {
        const value = point[`${strategyId}_value`];
        if (typeof value === "number") allValues.push(value);
      }
      for (const field of SIGNAL_FIELDS) {
        const value = point[field] as number | null;
        if (value != null) allValues.push(value);
      }
    }

    if (allValues.length === 0) return [0, 1000];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.05;
    return [Math.max(0, min - padding), max + padding];
  }, [chartData, strategyIds]);

  const summary = useMemo(() => {
    if (!response) return null;
    return { strategies: response.strategies };
  }, [response]);

  const actualDays = useMemo(() => {
    if (!response || response.timeline.length < 2) return 0;
    const first = response.timeline[0];
    const last = response.timeline[response.timeline.length - 1];
    if (!first || !last) return 0;
    const diff = Math.abs(
      new Date(last.date).getTime() - new Date(first.date).getTime()
    );
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [response]);

  const sortedStrategyIds = useMemo(() => {
    if (!response) return [];
    const ids = [...strategyIds];
    const baseline = ids.includes("dca_classic") ? ["dca_classic"] : [];
    const rest = ids
      .filter(id => id !== "dca_classic")
      .sort((a, b) =>
        getStrategyDisplayName(a).localeCompare(getStrategyDisplayName(b))
      );
    return [...baseline, ...rest];
  }, [response, strategyIds]);

  const daysDisplay = useMemo(() => {
    if (
      requestedDays != null &&
      requestedDays !== actualDays &&
      actualDays > 0
    ) {
      return `${requestedDays} days requested (${actualDays} available)`;
    }
    return `${actualDays} days simulated`;
  }, [requestedDays, actualDays]);

  return {
    strategyIds,
    chartData,
    yAxisDomain,
    summary,
    sortedStrategyIds,
    actualDays,
    daysDisplay,
  };
}

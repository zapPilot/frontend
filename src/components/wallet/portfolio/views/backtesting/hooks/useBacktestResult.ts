"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { MarketDashboardPoint } from "@/schemas/api/analyticsSchemas";
import { getMarketDashboardData } from "@/services/analyticsService";
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

/**
 * Build a date-keyed lookup map from market dashboard snapshots.
 *
 * @param snapshots - Array of market dashboard data points
 * @returns Map keyed by snapshot_date (YYYY-MM-DD) for O(1) lookups
 */
function buildMarketDataMap(
  snapshots: MarketDashboardPoint[]
): Map<string, MarketDashboardPoint> {
  const map = new Map<string, MarketDashboardPoint>();
  for (const snap of snapshots) {
    map.set(snap.snapshot_date, snap);
  }
  return map;
}

export function useBacktestResult(
  response: BacktestResponse | null
): UseBacktestResultReturn {
  const actualDays = useMemo(() => {
    if (!response) return 0;
    return calculateActualDays(response.timeline);
  }, [response]);

  const { data: marketDashboard } = useQuery({
    queryKey: ["marketDashboard", "btc", actualDays],
    queryFn: () => getMarketDashboardData(actualDays, "btc"),
    enabled: actualDays > 0,
    staleTime: 5 * 60 * 1000,
  });

  const marketDataMap = useMemo(() => {
    if (!marketDashboard?.snapshots)
      return new Map<string, MarketDashboardPoint>();
    return buildMarketDataMap(marketDashboard.snapshots);
  }, [marketDashboard]);

  const strategyIds = useMemo(() => {
    if (!response) return [];
    return Object.keys(response.strategies ?? {});
  }, [response]);

  const chartData = useMemo(() => {
    if (!response) return [];
    return response.timeline.map(point =>
      buildChartPoint(point, strategyIds, marketDataMap)
    );
  }, [response, strategyIds, marketDataMap]);

  const yAxisDomain = useMemo((): [number, number] => {
    return calculateYAxisDomain(chartData, strategyIds);
  }, [chartData, strategyIds]);

  const summary = response ? { strategies: response.strategies } : null;

  const sortedStrategyIds = useMemo(() => {
    return sortStrategyIds(strategyIds);
  }, [strategyIds]);

  return {
    chartData,
    yAxisDomain,
    summary,
    sortedStrategyIds,
    actualDays,
  };
}

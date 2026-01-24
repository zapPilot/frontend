"use client";

import type { BacktestResponse } from "@/types/backtesting";
import { useMemo } from "react";

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
    if (!response) return ["dca_classic", "smart_dca"];
    return Object.keys(response.strategies);
  }, [response]);

  const chartData = useMemo(() => {
    if (!response) return [];
    return response.timeline.map(point => {
      const data: Record<string, unknown> = { ...point };

      for (const strategyId of strategyIds) {
        const strategy = point.strategies[strategyId];
        if (strategy) {
          data[`${strategyId}_value`] = strategy.portfolio_value;
        }
      }

      let buySpotSignal: number | null = null;
      let sellSpotSignal: number | null = null;
      let buyLpSignal: number | null = null;
      let sellLpSignal: number | null = null;
      const eventStrategies: Record<string, string[]> = {
        buy_spot: [],
        sell_spot: [],
        buy_lp: [],
        sell_lp: [],
      };

      for (const strategyId of strategyIds) {
        if (strategyId === "dca_classic") continue;
        const strategy = point.strategies[strategyId];
        if (strategy?.event) {
          const displayName = getStrategyDisplayName(strategyId);
          switch (strategy.event) {
            case "buy_spot":
              buySpotSignal = strategy.portfolio_value;
              eventStrategies["buy_spot"]?.push(displayName);
              break;
            case "sell_spot":
              sellSpotSignal = strategy.portfolio_value;
              eventStrategies["sell_spot"]?.push(displayName);
              break;
            case "buy_lp":
              buyLpSignal = strategy.portfolio_value;
              eventStrategies["buy_lp"]?.push(displayName);
              break;
            case "sell_lp":
              sellLpSignal = strategy.portfolio_value;
              eventStrategies["sell_lp"]?.push(displayName);
              break;
          }
        }
      }

      data["buySpotSignal"] = buySpotSignal;
      data["sellSpotSignal"] = sellSpotSignal;
      data["buyLpSignal"] = buyLpSignal;
      data["sellLpSignal"] = sellLpSignal;
      data["eventStrategies"] = eventStrategies;
      return data;
    });
  }, [response, strategyIds]);

  const yAxisDomain = useMemo((): [number, number] => {
    if (!chartData || chartData.length === 0) return [0, 1000];
    const allValues: number[] = [];
    for (const point of chartData) {
      for (const strategyId of strategyIds) {
        const value = point[`${strategyId}_value`];
        if (typeof value === "number" && value != null) allValues.push(value);
      }
      const buySpot = point["buySpotSignal"] as number | null;
      const sellSpot = point["sellSpotSignal"] as number | null;
      const buyLp = point["buyLpSignal"] as number | null;
      const sellLp = point["sellLpSignal"] as number | null;
      if (buySpot != null) allValues.push(buySpot);
      if (sellSpot != null) allValues.push(sellSpot);
      if (buyLp != null) allValues.push(buyLp);
      if (sellLp != null) allValues.push(sellLp);
    }
    if (allValues.length === 0) return [0, 1000];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    const padding = range * 0.05;
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
    const core = ["dca_classic", "smart_dca"];
    const rest = strategyIds
      .filter(id => !core.includes(id))
      .sort((a, b) => a.localeCompare(b));
    return [...core.filter(id => strategyIds.includes(id)), ...rest];
  }, [strategyIds]);

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

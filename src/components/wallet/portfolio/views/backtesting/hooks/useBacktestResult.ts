"use client";

import { useMemo } from "react";

import type {
  BacktestResponse,
  BacktestTimelinePoint,
} from "@/types/backtesting";

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

type SignalKey = "buy_spot" | "sell_spot" | "buy_lp" | "sell_lp";

interface SignalAccumulator {
  buySpotSignal: number | null;
  sellSpotSignal: number | null;
  buyLpSignal: number | null;
  sellLpSignal: number | null;
  eventStrategies: Record<SignalKey, string[]>;
}

function sentimentLabelToIndex(
  label: string | null | undefined
): number | null {
  switch (label) {
    case "extreme_fear":
      return 0;
    case "fear":
      return 1;
    case "neutral":
      return 2;
    case "greed":
      return 3;
    case "extreme_greed":
      return 4;
    default:
      return null;
  }
}

function extractTransfers(
  metrics: Record<string, unknown> | undefined
): { from_bucket?: string; to_bucket?: string }[] {
  const metadata = (metrics as { metadata?: unknown } | undefined)?.metadata as
    | { transfers?: unknown }
    | undefined;
  const transfers = metadata?.transfers;
  if (!Array.isArray(transfers)) return [];
  return transfers.filter(
    (t): t is { from_bucket?: string; to_bucket?: string } =>
      t != null && typeof t === "object"
  );
}

function isDcaBaseline(metrics: Record<string, unknown> | undefined): boolean {
  const signal = (metrics as { signal?: unknown } | undefined)?.signal;
  return signal === "dca";
}

function classifyTransfer(from: string, to: string): SignalKey | null {
  // spot -> stable/lp = sell_spot
  if (from === "spot" && (to === "stable" || to === "lp")) {
    return "sell_spot";
  }
  // stable/lp -> spot = buy_spot
  if (to === "spot" && (from === "stable" || from === "lp")) {
    return "buy_spot";
  }
  // stable/spot -> lp = buy_lp
  if (to === "lp" && (from === "stable" || from === "spot")) {
    return "buy_lp";
  }
  // lp -> stable/spot = sell_lp
  if (from === "lp" && (to === "stable" || to === "spot")) {
    return "sell_lp";
  }
  return null;
}

function updateSignal(
  acc: SignalAccumulator,
  signalKey: SignalKey,
  portfolioValue: number,
  displayName: string
): void {
  const signalMap: Record<
    SignalKey,
    "buySpotSignal" | "sellSpotSignal" | "buyLpSignal" | "sellLpSignal"
  > = {
    buy_spot: "buySpotSignal",
    sell_spot: "sellSpotSignal",
    buy_lp: "buyLpSignal",
    sell_lp: "sellLpSignal",
  };

  const field = signalMap[signalKey];
  const current = acc[field];
  acc[field] =
    current == null ? portfolioValue : Math.max(current, portfolioValue);

  const strategies = acc.eventStrategies[signalKey];
  if (!strategies.includes(displayName)) {
    strategies.push(displayName);
  }
}

function processStrategyTransfers(
  point: BacktestTimelinePoint,
  strategyIds: string[],
  acc: SignalAccumulator
): void {
  for (const strategyId of strategyIds) {
    const strategy = point.strategies[strategyId];
    if (!strategy) continue;
    if (isDcaBaseline(strategy.metrics)) continue;

    const transfers = extractTransfers(strategy.metrics);
    if (transfers.length === 0) continue;

    const displayName = getStrategyDisplayName(strategyId);
    for (const transfer of transfers) {
      const { from_bucket: from, to_bucket: to } = transfer;
      if (!from || !to) continue;

      const signalKey = classifyTransfer(from, to);
      if (signalKey) {
        updateSignal(acc, signalKey, strategy.portfolio_value, displayName);
      }
    }
  }
}

function createSignalAccumulator(): SignalAccumulator {
  return {
    buySpotSignal: null,
    sellSpotSignal: null,
    buyLpSignal: null,
    sellLpSignal: null,
    eventStrategies: {
      buy_spot: [],
      sell_spot: [],
      buy_lp: [],
      sell_lp: [],
    },
  };
}

function buildChartPoint(
  point: BacktestTimelinePoint,
  strategyIds: string[]
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...point };

  for (const strategyId of strategyIds) {
    const strategy = point.strategies[strategyId];
    if (strategy) {
      data[`${strategyId}_value`] = strategy.portfolio_value;
    }
  }

  data["sentiment"] = sentimentLabelToIndex(point.sentiment_label ?? undefined);

  const acc = createSignalAccumulator();
  processStrategyTransfers(point, strategyIds, acc);

  data["buySpotSignal"] = acc.buySpotSignal;
  data["sellSpotSignal"] = acc.sellSpotSignal;
  data["buyLpSignal"] = acc.buyLpSignal;
  data["sellLpSignal"] = acc.sellLpSignal;
  data["eventStrategies"] = acc.eventStrategies;

  return data;
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

import type { BacktestTimelinePoint } from "@/types/backtesting";

import { DCA_CLASSIC_STRATEGY_ID } from "../constants";
import { getStrategyDisplayName } from "./strategyDisplay";

export type SignalKey = "buy_spot" | "sell_spot";

export interface SignalConfig {
  key: SignalKey;
  field: string;
  name: string;
  color: string;
  shape:
    | "circle"
    | "cross"
    | "diamond"
    | "square"
    | "star"
    | "triangle"
    | "wye";
}

/** Unified signal configuration */
export const CHART_SIGNALS: SignalConfig[] = [
  {
    key: "buy_spot",
    field: "buySpotSignal",
    name: "Buy Spot",
    color: "#22c55e",
    shape: "circle",
  },
  {
    key: "sell_spot",
    field: "sellSpotSignal",
    name: "Sell Spot",
    color: "#ef4444",
    shape: "circle",
  },
];

const SIGNAL_FIELDS = CHART_SIGNALS.map(s => s.field);
const SENTIMENT_INDEX_MAP: Record<string, number> = {
  extreme_fear: 0,
  fear: 25,
  neutral: 50,
  greed: 75,
  extreme_greed: 100,
};
const MS_PER_DAY = 86_400_000;
const DEFAULT_Y_DOMAIN: [number, number] = [0, 1000];

interface SignalAccumulator {
  [key: string]: number | null | Record<SignalKey, string[]>;
  eventStrategies: Record<SignalKey, string[]>;
}

type BacktestStrategy = NonNullable<
  BacktestTimelinePoint["strategies"][string]
>;

function classifyTransfer(from: string, to: string): SignalKey | null {
  if (from === "stable" && to === "spot") {
    return "buy_spot";
  }

  if (from === "spot" && to === "stable") {
    return "sell_spot";
  }

  return null;
}

function updateSignal(
  acc: SignalAccumulator,
  signalKey: SignalKey,
  portfolioValue: number,
  displayName: string
): void {
  const config = CHART_SIGNALS.find(s => s.key === signalKey);
  if (!config) return;

  const current = acc[config.field] as number | null;
  acc[config.field] =
    current == null ? portfolioValue : Math.max(current, portfolioValue);

  const strategies = acc.eventStrategies[signalKey];
  if (!strategies.includes(displayName)) {
    strategies.push(displayName);
  }
}

function getTransfers(
  strategy: BacktestStrategy
): BacktestStrategy["execution"]["transfers"] {
  return strategy.execution.transfers ?? [];
}

function processStrategyTransfers(
  point: BacktestTimelinePoint,
  strategyIds: string[],
  acc: SignalAccumulator
): void {
  for (const strategyId of strategyIds) {
    if (strategyId === DCA_CLASSIC_STRATEGY_ID) {
      continue;
    }

    const strategy = point.strategies[strategyId];
    if (!strategy) {
      continue;
    }

    const displayName = getStrategyDisplayName(strategyId);
    for (const transfer of getTransfers(strategy)) {
      const signalKey = classifyTransfer(
        transfer.from_bucket,
        transfer.to_bucket
      );
      if (!signalKey) {
        continue;
      }

      updateSignal(acc, signalKey, strategy.portfolio.total_value, displayName);
    }
  }
}

function createSignalAccumulator(): SignalAccumulator {
  const acc: SignalAccumulator = {
    eventStrategies: {} as Record<SignalKey, string[]>,
  };

  for (const s of CHART_SIGNALS) {
    acc[s.field] = null;
    acc.eventStrategies[s.key] = [];
  }

  return acc;
}

function getPointValues(
  point: Record<string, unknown>,
  strategyIds: string[]
): number[] {
  const keys = [...strategyIds.map(id => `${id}_value`), ...SIGNAL_FIELDS];
  const values: number[] = [];

  for (const key of keys) {
    const value = point[key];
    if (typeof value === "number") {
      values.push(value);
    }
  }

  return values;
}

function getPrimaryDma(
  point: BacktestTimelinePoint,
  strategyIds: string[]
): number | null {
  for (const strategyId of strategyIds) {
    const signal = point.strategies[strategyId]?.signal;
    const details = signal?.details;
    const dmaDetails =
      details && typeof details === "object" && "dma" in details
        ? (details.dma as { dma_200?: number | null } | null | undefined)
        : null;
    const dma = dmaDetails?.dma_200;
    if (typeof dma === "number") {
      return dma;
    }
  }

  return null;
}

export function sentimentLabelToIndex(
  label: string | null | undefined
): number | null {
  if (!label) {
    return null;
  }

  return SENTIMENT_INDEX_MAP[label] ?? null;
}

export function calculateYAxisDomain(
  chartData: Record<string, unknown>[],
  strategyIds: string[]
): [number, number] {
  if (!chartData.length) return DEFAULT_Y_DOMAIN;

  let min = Infinity;
  let max = -Infinity;

  for (const point of chartData) {
    const values = getPointValues(point, strategyIds);
    if (values.length > 0) {
      min = Math.min(min, ...values);
      max = Math.max(max, ...values);
    }
  }

  if (min === Infinity || max === -Infinity) return DEFAULT_Y_DOMAIN;

  const padding = (max - min) * 0.05;
  return [Math.max(0, min - padding), max + padding];
}

export function calculateActualDays(timeline: BacktestTimelinePoint[]): number {
  if (timeline.length < 2) return 0;

  const firstPoint = timeline[0];
  const lastPoint = timeline[timeline.length - 1];

  if (!firstPoint || !lastPoint) return 0;

  const start = new Date(firstPoint.market.date).getTime();
  const end = new Date(lastPoint.market.date).getTime();

  return Math.ceil(Math.abs(end - start) / MS_PER_DAY) + 1;
}

export function getPrimaryStrategyId(sortedIds: string[]): string | null {
  return (
    sortedIds.find(id => id !== DCA_CLASSIC_STRATEGY_ID) ?? sortedIds[0] ?? null
  );
}

export function sortStrategyIds(ids: string[]): string[] {
  const dca: string[] = [];
  if (ids.includes(DCA_CLASSIC_STRATEGY_ID)) {
    dca.push(DCA_CLASSIC_STRATEGY_ID);
  }

  const others = ids
    .filter(id => id !== DCA_CLASSIC_STRATEGY_ID)
    .sort((a, b) =>
      getStrategyDisplayName(a).localeCompare(getStrategyDisplayName(b))
    );

  return [...dca, ...others];
}

export function buildChartPoint(
  point: BacktestTimelinePoint,
  strategyIds: string[]
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    date: point.market.date,
    market: point.market,
    strategies: point.strategies,
  };

  for (const id of strategyIds) {
    const strategy = point.strategies[id];
    if (strategy) {
      data[`${id}_value`] = strategy.portfolio.total_value;
    }
  }

  data["btc_price"] = point.market.token_price["btc"] ?? null;
  data["dma_200"] = getPrimaryDma(point, strategyIds);
  data["sentiment"] =
    point.market.sentiment ??
    sentimentLabelToIndex(point.market.sentiment_label);

  const acc = createSignalAccumulator();
  processStrategyTransfers(point, strategyIds, acc);

  for (const signal of CHART_SIGNALS) {
    data[signal.field] = acc[signal.field];
  }
  data["eventStrategies"] = acc.eventStrategies;

  return data;
}

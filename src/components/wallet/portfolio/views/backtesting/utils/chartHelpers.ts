import type { BacktestTimelinePoint } from "@/types/backtesting";

import { DCA_CLASSIC_STRATEGY_ID } from "../constants";
import { getStrategyDisplayName } from "./strategyDisplay";

// --- Signal Types & Constants ---

export type SignalKey =
  | "buy_spot"
  | "sell_spot"
  | "buy_lp"
  | "sell_lp"
  | "borrow"
  | "repay"
  | "liquidate";

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
  {
    key: "buy_lp",
    field: "buyLpSignal",
    name: "Buy LP",
    color: "#3b82f6",
    shape: "circle",
  },
  {
    key: "sell_lp",
    field: "sellLpSignal",
    name: "Sell LP",
    color: "#d946ef",
    shape: "circle",
  },
  {
    key: "borrow",
    field: "borrowSignal",
    name: "Borrow",
    color: "#a855f7",
    shape: "triangle",
  },
  {
    key: "repay",
    field: "repaySignal",
    name: "Repay",
    color: "#06b6d4",
    shape: "diamond",
  },
  {
    key: "liquidate",
    field: "liquidateSignal",
    name: "Liquidation",
    color: "#dc2626",
    shape: "cross",
  },
];

export const SIGNAL_FIELDS = CHART_SIGNALS.map(s => s.field);

/** Sentiment label to numeric index for Y-axis positioning */
const SENTIMENT_MAP: Record<string, number> = {
  extreme_fear: 0,
  fear: 1,
  neutral: 2,
  greed: 3,
  extreme_greed: 4,
};

// --- Helper Types ---

interface SignalAccumulator {
  [key: string]: number | null | Record<string, string[]> | unknown;
  eventStrategies: Record<SignalKey, string[]>;
}

interface Transfer {
  from_bucket?: string;
  to_bucket?: string;
}

// --- Logic ---

export function sentimentLabelToIndex(
  label: string | null | undefined
): number | null {
  if (!label) return null;
  return SENTIMENT_MAP[label] ?? null;
}

const TRANSFER_SIGNAL_MAP: Record<string, Record<string, SignalKey>> = {
  spot: { stable: "sell_spot", lp: "sell_spot" },
  stable: { spot: "buy_spot", lp: "buy_lp" },
  lp: { spot: "sell_lp", stable: "sell_lp" },
};

function classifyTransfer(from: string, to: string): SignalKey | null {
  return TRANSFER_SIGNAL_MAP[from]?.[to] ?? null;
}

function classifyBorrowEvent(
  metrics: Record<string, unknown> | undefined
): SignalKey | null {
  const event = metrics?.["borrow_event"];
  if (event === "borrow" || event === "repay" || event === "liquidate") {
    return event as SignalKey;
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

  const field = config.field;
  const current = acc[field] as number | null;
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
    if (!strategy || strategy.metrics?.["signal"] === "dca") continue;

    const displayName = getStrategyDisplayName(strategyId);

    // 1. Borrow events
    const borrowSignalKey = classifyBorrowEvent(strategy.metrics);
    if (borrowSignalKey) {
      updateSignal(acc, borrowSignalKey, strategy.portfolio_value, displayName);
    }

    // 2. Transfer events
    const metadata = strategy.metrics?.["metadata"] as
      | { transfers?: Transfer[] }
      | undefined;
    const transfers = metadata?.transfers;
    if (Array.isArray(transfers)) {
      for (const { from_bucket, to_bucket } of transfers) {
        if (!from_bucket || !to_bucket) continue;
        const signalKey = classifyTransfer(from_bucket, to_bucket);
        if (signalKey) {
          updateSignal(acc, signalKey, strategy.portfolio_value, displayName);
        }
      }
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
  const values: number[] = [];

  // Strategy values
  for (const id of strategyIds) {
    const val = point[`${id}_value`];
    if (typeof val === "number") {
      values.push(val);
    }
  }

  // Signal values
  for (const field of SIGNAL_FIELDS) {
    const val = point[field];
    if (typeof val === "number") {
      values.push(val);
    }
  }

  return values;
}

export function calculateYAxisDomain(
  chartData: Record<string, unknown>[],
  strategyIds: string[]
): [number, number] {
  if (!chartData.length) return [0, 1000];

  let min = Infinity;
  let max = -Infinity;

  for (const point of chartData) {
    const values = getPointValues(point, strategyIds);
    if (values.length > 0) {
      min = Math.min(min, ...values);
      max = Math.max(max, ...values);
    }
  }

  if (min === Infinity || max === -Infinity) return [0, 1000];

  const padding = (max - min) * 0.05;
  return [Math.max(0, min - padding), max + padding];
}

export function calculateActualDays(timeline: BacktestTimelinePoint[]): number {
  if (timeline.length < 2) return 0;

  const firstPoint = timeline[0];
  const lastPoint = timeline[timeline.length - 1];

  if (!firstPoint || !lastPoint) return 0;

  const start = new Date(firstPoint.date).getTime();
  const end = new Date(lastPoint.date).getTime();

  return Math.ceil(Math.abs(end - start) / 86400000) + 1;
}

export function sortStrategyIds(ids: string[]): string[] {
  const dca = ids.includes(DCA_CLASSIC_STRATEGY_ID)
    ? [DCA_CLASSIC_STRATEGY_ID]
    : [];
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
  const data: Record<string, unknown> = { ...point };

  // Strategy values
  for (const id of strategyIds) {
    const s = point.strategies[id];
    if (s) {
      data[`${id}_value`] = s.portfolio_value;
    }
  }

  // Sentiment
  data["sentiment"] =
    point.sentiment ??
    sentimentLabelToIndex(point.sentiment_label ?? undefined);

  // Signals
  const acc = createSignalAccumulator();
  processStrategyTransfers(point, strategyIds, acc);

  for (const s of CHART_SIGNALS) {
    data[s.field] = acc[s.field];
  }
  data["eventStrategies"] = acc.eventStrategies;

  return data;
}

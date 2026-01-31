import type { BacktestTimelinePoint } from "@/types/backtesting";

import { getStrategyDisplayName } from "./strategyDisplay";

/** Unified signal configuration - single source of truth for signal keys and chart fields */
export const SIGNALS = {
  buy_spot: { field: "buySpotSignal" },
  sell_spot: { field: "sellSpotSignal" },
  buy_lp: { field: "buyLpSignal" },
  sell_lp: { field: "sellLpSignal" },
} as const;

export type SignalKey = keyof typeof SIGNALS;
export type SignalField = (typeof SIGNALS)[SignalKey]["field"];

export const SIGNAL_FIELDS = Object.values(SIGNALS).map(
  s => s.field
) as SignalField[];

interface SignalAccumulator {
  buySpotSignal: number | null;
  sellSpotSignal: number | null;
  buyLpSignal: number | null;
  sellLpSignal: number | null;
  eventStrategies: Record<SignalKey, string[]>;
}

/** Sentiment label to numeric index for Y-axis positioning */
const SENTIMENT_MAP: Record<string, number> = {
  extreme_fear: 0,
  fear: 1,
  neutral: 2,
  greed: 3,
  extreme_greed: 4,
};

export function sentimentLabelToIndex(
  label: string | null | undefined
): number | null {
  if (!label) return null;
  return SENTIMENT_MAP[label] ?? null;
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
  const field = SIGNALS[signalKey].field;
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

export function buildChartPoint(
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

  data["sentiment"] =
    point.sentiment ??
    sentimentLabelToIndex(point.sentiment_label ?? undefined);

  const acc = createSignalAccumulator();
  processStrategyTransfers(point, strategyIds, acc);

  data["buySpotSignal"] = acc.buySpotSignal;
  data["sellSpotSignal"] = acc.sellSpotSignal;
  data["buyLpSignal"] = acc.buyLpSignal;
  data["sellLpSignal"] = acc.sellLpSignal;
  data["eventStrategies"] = acc.eventStrategies;

  return data;
}

import type {
  BacktestPortfolioAllocation,
  BacktestStrategyPoint,
} from "@/types/backtesting";
import { formatCurrency } from "@/utils";

import { CHART_SIGNALS } from "../utils/chartHelpers";
import { getStrategyDisplayName } from "../utils/strategyDisplay";

const SIGNAL_EVENT_KEYS = new Set<string>(["buy_spot", "sell_spot"]);

const SIGNAL_TO_EVENT_KEY: Record<string, string> = Object.fromEntries(
  CHART_SIGNALS.filter(s => SIGNAL_EVENT_KEYS.has(s.key)).map(s => [
    s.name,
    s.key,
  ])
);

const KNOWN_SIGNALS = ["BTC Price", "Sentiment", "VIX", "DMA 200"];

export interface BacktestTooltipProps {
  active?: boolean;
  payload?: {
    name?: string;
    value?: number;
    color?: string;
    payload?: Record<string, unknown>;
  }[];
  label?: string | number;
  /** Strategy IDs in chart legend order. If provided, allocation bars use this order. */
  sortedStrategyIds?: string[];
}

interface TooltipPayloadEntry {
  name?: string;
  value?: number;
  color?: string;
  payload?: Record<string, unknown>;
}

export interface TooltipItem {
  name: string;
  value: number;
  color: string;
}

export interface EventItem {
  name: string;
  strategies: string[];
  color: string;
}

export interface SignalItem {
  name: string;
  value: string | number;
  color: string;
}

export interface AllocationBlock {
  id: string;
  displayName: string;
  allocation: BacktestPortfolioAllocation;
  index: number | undefined;
}

export interface DetailItem {
  name: string;
  value: string;
  color: string;
}

export interface ParsedTooltipData {
  dateStr: string;
  sections: {
    strategies: TooltipItem[];
    events: EventItem[];
    signals: SignalItem[];
    details: DetailItem[];
    allocations: AllocationBlock[];
  };
}

type StrategiesRecord = Record<string, BacktestStrategyPoint>;
type EventStrategiesRecord = Record<string, string[]>;

interface TooltipSections {
  strategies: TooltipItem[];
  events: EventItem[];
  signals: SignalItem[];
  details: DetailItem[];
}

function getOrderedStrategyIds(
  strategies: StrategiesRecord | undefined,
  sortedStrategyIds: string[] | undefined
): string[] {
  const strategyKeys = Object.keys(strategies ?? {});
  if (!sortedStrategyIds?.length) {
    return strategyKeys;
  }

  const sortedExistingIds = sortedStrategyIds.filter(id => strategies?.[id]);
  const remainingIds = strategyKeys.filter(
    id => !sortedExistingIds.includes(id)
  );
  return [...sortedExistingIds, ...remainingIds];
}

function hasAllocationData(allocation: BacktestPortfolioAllocation): boolean {
  return allocation.spot > 0 || allocation.stable > 0;
}

function buildAllocationBlock(
  strategyId: string,
  strategies: StrategiesRecord | undefined,
  sortedStrategyIds: string[] | undefined
): AllocationBlock | null {
  const strategy = strategies?.[strategyId];
  const allocation = strategy?.portfolio?.allocation;
  if (!allocation || !hasAllocationData(allocation)) {
    return null;
  }

  return {
    id: strategyId,
    displayName: getStrategyDisplayName(strategyId),
    allocation,
    index: sortedStrategyIds?.indexOf(strategyId),
  };
}

function buildAllocations(
  orderedIds: string[],
  strategies: StrategiesRecord | undefined,
  sortedStrategyIds: string[] | undefined
): AllocationBlock[] {
  return orderedIds
    .map(strategyId =>
      buildAllocationBlock(strategyId, strategies, sortedStrategyIds)
    )
    .filter((allocation): allocation is AllocationBlock => allocation !== null);
}

function formatSentimentValue(
  value: number | undefined,
  sentiment: string | undefined
): string {
  const label = sentiment
    ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
    : "Unknown";
  return `${label} (${value})`;
}

function formatSignalValue(
  signalName: string,
  value: number | undefined,
  sentiment: string | undefined
): string | number {
  if (signalName === "Sentiment") {
    return formatSentimentValue(value, sentiment);
  }

  if (signalName === "BTC Price" || signalName === "DMA 200") {
    if (typeof value === "number") {
      return formatCurrency(value, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    return "";
  }

  if (typeof value === "number") {
    return Number(value.toFixed(2));
  }

  return value ?? "";
}

function buildTooltipSections(
  payload: TooltipPayloadEntry[],
  eventStrategies: EventStrategiesRecord | undefined,
  sentiment: string | undefined,
  strategies: StrategiesRecord | undefined,
  orderedIds: string[]
): TooltipSections {
  const strategyItems: TooltipItem[] = [];
  const eventItems: EventItem[] = [];
  const signalItems: SignalItem[] = [];
  const detailItems: DetailItem[] = [];

  for (const entry of payload) {
    if (!entry) {
      continue;
    }

    const name = entry.name || "";
    const color = entry.color || "#fff";

    if (KNOWN_SIGNALS.includes(name)) {
      signalItems.push({
        name,
        value: formatSignalValue(name, entry.value, sentiment),
        color,
      });
      continue;
    }

    const eventKey = SIGNAL_TO_EVENT_KEY[name];
    if (eventKey) {
      eventItems.push({
        name,
        strategies: eventStrategies?.[eventKey] || [],
        color,
      });
      continue;
    }

    if (typeof entry.value === "number") {
      strategyItems.push({ name, value: entry.value, color });
    }
  }

  for (const strategyId of orderedIds) {
    const strategy = strategies?.[strategyId];
    if (strategy?.signal == null) {
      continue;
    }

    const displayName = getStrategyDisplayName(strategyId);
    detailItems.push({
      name: `${displayName} decision`,
      value: `${strategy.decision.action} · ${strategy.decision.reason}`,
      color: "#cbd5e1",
    });

    if (strategy.execution.blocked_reason) {
      detailItems.push({
        name: `${displayName} blocked`,
        value: strategy.execution.blocked_reason,
        color: "#fda4af",
      });
    }

    const buyGateBlockReason = getBuyGateBlockReason(strategy);
    if (buyGateBlockReason) {
      detailItems.push({
        name: `${displayName} buy gate`,
        value: buyGateBlockReason,
        color: "#fcd34d",
      });
    }
  }

  return {
    strategies: strategyItems,
    events: eventItems,
    signals: signalItems,
    details: detailItems,
  };
}

function getBuyGateBlockReason(strategy: BacktestStrategyPoint): string | null {
  const plugin = strategy.execution.diagnostics?.plugins?.["dma_buy_gate"];
  if (!plugin || typeof plugin !== "object") {
    return null;
  }

  const blockReason = plugin["block_reason"];
  return typeof blockReason === "string" ? blockReason : null;
}

export function useBacktestTooltipData({
  payload,
  label,
  sortedStrategyIds,
}: BacktestTooltipProps): ParsedTooltipData | null {
  if (!payload || payload.length === 0) return null;

  const firstPayload = payload[0]?.payload as
    | Record<string, unknown>
    | undefined;
  const market = firstPayload?.["market"] as
    | { date?: string; sentiment_label?: string | null }
    | undefined;
  const dateStr = new Date(String(market?.date ?? label)).toLocaleDateString();
  const sentiment = market?.sentiment_label ?? undefined;

  const eventStrategies = firstPayload?.["eventStrategies"] as
    | EventStrategiesRecord
    | undefined;
  const strategies = firstPayload?.["strategies"] as
    | StrategiesRecord
    | undefined;
  const orderedIds = getOrderedStrategyIds(strategies, sortedStrategyIds);
  const allocations = buildAllocations(
    orderedIds,
    strategies,
    sortedStrategyIds
  );
  const sections = buildTooltipSections(
    payload,
    eventStrategies,
    sentiment,
    strategies,
    orderedIds
  );

  // Compute BTC / DMA 200 ratio from signal items
  const btcSignal = sections.signals.find(s => s.name === "BTC Price");
  const dmaSignal = sections.signals.find(s => s.name === "DMA 200");
  if (btcSignal && dmaSignal) {
    const btcNum = parseNumericSignal(btcSignal.value);
    const dmaNum = parseNumericSignal(dmaSignal.value);
    if (btcNum != null && dmaNum != null && dmaNum > 0) {
      sections.signals.push({
        name: "BTC / DMA 200",
        value: (btcNum / dmaNum).toFixed(2),
        color: "#a78bfa",
      });
    }
  }

  return {
    dateStr,
    sections: { ...sections, allocations },
  };
}

/**
 * Extracts a numeric value from a signal value that may be a formatted currency string or a number.
 *
 * @param value - The signal value (string like "$98,432" or number)
 * @returns The numeric value, or null if parsing fails
 */
function parseNumericSignal(value: string | number): number | null {
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[$,]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

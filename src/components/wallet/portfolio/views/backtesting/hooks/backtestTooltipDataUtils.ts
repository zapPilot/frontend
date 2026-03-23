import type {
  BacktestPortfolioAllocation,
  BacktestStrategyPoint,
} from "@/types/backtesting";
import { formatCurrency } from "@/utils";

import { hasBacktestAllocation } from "../backtestBuckets";
import { CHART_SIGNALS } from "../utils/chartHelpers";
import {
  getBacktestSpotAssetColor,
  resolveBacktestSpotAsset,
  type SpotAssetSymbol,
} from "../utils/spotAssetDisplay";
import { getStrategyDisplayName } from "../utils/strategyDisplay";

const SIGNAL_EVENT_KEYS = new Set<string>([
  "buy_spot",
  "sell_spot",
  "switch_to_eth",
  "switch_to_btc",
]);
const SIGNAL_TO_EVENT_KEY: Record<string, string> = Object.fromEntries(
  CHART_SIGNALS.filter(signal => SIGNAL_EVENT_KEYS.has(signal.key)).map(
    signal => [signal.name, signal.key]
  )
);
const KNOWN_SIGNALS = ["BTC Price", "Sentiment", "VIX", "DMA 200"];

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
  spotAssetLabel?: SpotAssetSymbol;
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

export interface BacktestTooltipPayloadEntry {
  name?: string;
  value?: number;
  color?: string;
  payload?: Record<string, unknown>;
}

type StrategiesRecord = Record<string, BacktestStrategyPoint>;
type EventStrategiesRecord = Record<string, string[]>;

interface TooltipSections {
  strategies: TooltipItem[];
  events: EventItem[];
  signals: SignalItem[];
  details: DetailItem[];
}

interface ParsedTooltipSource {
  payload: BacktestTooltipPayloadEntry[];
  label: string | number | undefined;
  sortedStrategyIds: string[] | undefined;
}

const getOrderedStrategyIds = (
  strategies: StrategiesRecord | undefined,
  sortedStrategyIds: string[] | undefined
): string[] => {
  const strategyKeys = Object.keys(strategies ?? {});
  if (!sortedStrategyIds?.length) {
    return strategyKeys;
  }

  return sortedStrategyIds.filter(id => strategies?.[id]);
};

const buildAllocationBlock = (
  strategyId: string,
  strategies: StrategiesRecord | undefined,
  sortedStrategyIds: string[] | undefined
): AllocationBlock | null => {
  const strategy = strategies?.[strategyId];
  const allocation = strategy?.portfolio?.allocation;
  if (!allocation || !hasBacktestAllocation(allocation)) {
    return null;
  }

  const spotAssetLabel = resolveBacktestSpotAsset(strategy);

  return {
    id: strategyId,
    displayName: getStrategyDisplayName(strategyId),
    allocation,
    index: sortedStrategyIds?.indexOf(strategyId),
    ...(spotAssetLabel ? { spotAssetLabel } : {}),
  };
};

const buildAllocations = (
  orderedIds: string[],
  strategies: StrategiesRecord | undefined,
  sortedStrategyIds: string[] | undefined
): AllocationBlock[] =>
  orderedIds
    .map(strategyId =>
      buildAllocationBlock(strategyId, strategies, sortedStrategyIds)
    )
    .filter((allocation): allocation is AllocationBlock => allocation !== null);

const formatSentimentValue = (
  value: number | undefined,
  sentiment: string | undefined
): string => {
  const label = sentiment
    ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
    : "Unknown";

  return `${label} (${value})`;
};

const formatSignalValue = (
  signalName: string,
  value: number | undefined,
  sentiment: string | undefined
): string | number => {
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
};

const getBuyGateBlockReason = (
  strategy: BacktestStrategyPoint
): string | null => {
  const plugin = strategy.execution.diagnostics?.plugins?.["dma_buy_gate"];
  if (!plugin || typeof plugin !== "object") {
    return null;
  }

  const blockReason = plugin["block_reason"];
  return typeof blockReason === "string" ? blockReason : null;
};

const buildTooltipSections = (
  payload: BacktestTooltipPayloadEntry[],
  eventStrategies: EventStrategiesRecord | undefined,
  sentiment: string | undefined,
  strategies: StrategiesRecord | undefined,
  orderedIds: string[]
): TooltipSections => {
  const strategyItems: TooltipItem[] = [];
  const eventItems: EventItem[] = [];
  const signalItems: SignalItem[] = [];
  const detailItems: DetailItem[] = [];

  for (const entry of payload) {
    if (!entry) {
      continue;
    }

    const name = entry.name ?? "";
    const color = entry.color ?? "#fff";

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
        strategies: eventStrategies?.[eventKey] ?? [],
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

    const targetSpotAsset = resolveBacktestSpotAsset(strategy);
    if (targetSpotAsset) {
      detailItems.push({
        name: `${displayName} spot asset`,
        value: targetSpotAsset,
        color: getBacktestSpotAssetColor(targetSpotAsset),
      });
    }

    if (strategy.execution.blocked_reason) {
      detailItems.push({
        name: `${displayName} blocked`,
        value: strategy.execution.blocked_reason,
        color: "#fda4af",
      });
    }

    const buyGateBlockReason = getBuyGateBlockReason(strategy);
    if (!buyGateBlockReason) {
      continue;
    }

    detailItems.push({
      name: `${displayName} buy gate`,
      value: buyGateBlockReason,
      color: "#fcd34d",
    });
  }

  return {
    strategies: strategyItems,
    events: eventItems,
    signals: signalItems,
    details: detailItems,
  };
};

const parseNumericSignal = (value: string | number): number | null => {
  if (typeof value === "number") {
    return value;
  }

  const cleaned = value.replace(/[$,]/g, "");
  const numericValue = Number(cleaned);

  return Number.isFinite(numericValue) ? numericValue : null;
};

const appendBtcToDmaRatio = (sections: TooltipSections): void => {
  const btcSignal = sections.signals.find(
    signal => signal.name === "BTC Price"
  );
  const dmaSignal = sections.signals.find(signal => signal.name === "DMA 200");
  if (!btcSignal || !dmaSignal) {
    return;
  }

  const btcValue = parseNumericSignal(btcSignal.value);
  const dmaValue = parseNumericSignal(dmaSignal.value);
  if (btcValue == null || dmaValue == null || dmaValue <= 0) {
    return;
  }

  sections.signals.push({
    name: "BTC / DMA 200",
    value: (btcValue / dmaValue).toFixed(2),
    color: "#a78bfa",
  });
};

export const buildParsedTooltipData = ({
  payload,
  label,
  sortedStrategyIds,
}: ParsedTooltipSource): ParsedTooltipData | null => {
  if (payload.length === 0) {
    return null;
  }

  const firstPayload = payload[0]?.payload;
  const market = firstPayload?.["market"] as
    | { date?: string; sentiment_label?: string | null }
    | undefined;
  const eventStrategies = firstPayload?.["eventStrategies"] as
    | EventStrategiesRecord
    | undefined;
  const strategies = firstPayload?.["strategies"] as
    | StrategiesRecord
    | undefined;
  const orderedIds = getOrderedStrategyIds(strategies, sortedStrategyIds);
  const sections = buildTooltipSections(
    payload,
    eventStrategies,
    market?.sentiment_label ?? undefined,
    strategies,
    orderedIds
  );

  appendBtcToDmaRatio(sections);

  return {
    dateStr: new Date(String(market?.date ?? label)).toLocaleDateString(),
    sections: {
      ...sections,
      allocations: buildAllocations(orderedIds, strategies, sortedStrategyIds),
    },
  };
};

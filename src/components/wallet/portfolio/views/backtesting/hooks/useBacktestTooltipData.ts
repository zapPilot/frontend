import type { BacktestConstituentsSource } from "@/components/wallet/portfolio/components/allocation";
import { formatCurrency } from "@/utils";

import { CHART_SIGNALS } from "../utils/chartHelpers";
import {
  calculatePercentages,
  getStrategyDisplayName,
} from "../utils/strategyDisplay";

const SIGNAL_EVENT_KEYS = new Set<string>([
  "buy_spot",
  "sell_spot",
  "buy_lp",
  "sell_lp",
]);

const SIGNAL_TO_EVENT_KEY: Record<string, string> = Object.fromEntries(
  CHART_SIGNALS.filter(s => SIGNAL_EVENT_KEYS.has(s.key)).map(s => [
    s.name,
    s.key,
  ])
);

const KNOWN_SIGNALS = ["Sentiment", "VIX", "DMA 200"];

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
  constituents: BacktestConstituentsSource;
  spotBreakdown: string | null;
  index: number | undefined;
}

export interface ParsedTooltipData {
  dateStr: string;
  btcPrice: number | undefined;
  sections: {
    strategies: TooltipItem[];
    events: EventItem[];
    signals: SignalItem[];
    allocations: AllocationBlock[];
  };
}

export function useBacktestTooltipData({
  payload,
  label,
  sortedStrategyIds,
}: BacktestTooltipProps): ParsedTooltipData | null {
  if (!payload || payload.length === 0) return null;

  const dateStr = new Date(String(label)).toLocaleDateString();
  const firstPayload = payload[0]?.payload as
    | Record<string, unknown>
    | undefined;
  const sentiment = firstPayload?.["sentiment_label"] as string | undefined;

  const tokenPrice =
    (firstPayload?.["token_price"] as { btc?: number } | undefined)?.btc ??
    (firstPayload?.["price"] as number | undefined);

  const eventStrategies = firstPayload?.["eventStrategies"] as
    | Record<string, string[]>
    | undefined;

  const strategies = firstPayload?.["strategies"] as
    | Record<
        string,
        {
          portfolio_constituant?: BacktestConstituentsSource;
        }
      >
    | undefined;

  const orderedIds: string[] = (() => {
    const keys = Object.keys(strategies ?? {});
    if (!sortedStrategyIds?.length) return keys;
    const fromSorted = sortedStrategyIds.filter(id => strategies?.[id]);
    const rest = keys.filter(id => !fromSorted.includes(id));
    return [...fromSorted, ...rest];
  })();

  const allocations: AllocationBlock[] = orderedIds
    .map((id: string) => {
      const s = strategies?.[id];
      const constituents = s?.portfolio_constituant;
      if (!constituents) return null;
      const percentages = calculatePercentages(constituents);
      const hasAny =
        percentages.spot > 0 || percentages.stable > 0 || percentages.lp > 0;
      if (!hasAny) return null;

      // Prepare spot breakdown string if spot is a map
      let spotBreakdown: string | null = null;
      if (
        constituents.spot &&
        typeof constituents.spot === "object" &&
        !Array.isArray(constituents.spot)
      ) {
        const parts = Object.entries(constituents.spot)
          .filter(([, val]) => val > 0)
          .map(
            ([token, val]) =>
              `${token.toUpperCase()}: ${formatCurrency(val, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`
          );
        if (parts.length > 0) {
          spotBreakdown = parts.join(", ");
        }
      }

      return {
        id,
        displayName: getStrategyDisplayName(id),
        constituents,
        spotBreakdown,
        index: sortedStrategyIds?.indexOf(id),
      };
    })
    .filter((b): b is AllocationBlock => b != null);

  const strategyItems: TooltipItem[] = [];
  const eventItems: EventItem[] = [];
  const signalItems: SignalItem[] = [];

  for (const entry of payload) {
    if (!entry) continue;
    const name = entry.name || "";
    const color = entry.color || "#fff";

    if (KNOWN_SIGNALS.includes(name)) {
      let displayValue: string | number = entry.value as number;
      if (name === "Sentiment") {
        const label = sentiment
          ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
          : "Unknown";
        displayValue = `${label} (${entry.value})`;
      } else if (typeof entry.value === "number") {
        displayValue = Number(entry.value.toFixed(2));
      }
      signalItems.push({ name, value: displayValue, color });
    } else if (SIGNAL_TO_EVENT_KEY[name]) {
      const eventKey = SIGNAL_TO_EVENT_KEY[name] ?? "";
      if (eventKey) {
        const strategyList = eventStrategies?.[eventKey] || [];
        eventItems.push({ name, strategies: strategyList, color });
      }
    } else if (typeof entry.value === "number") {
      strategyItems.push({ name, value: entry.value, color });
    }
  }

  return {
    dateStr,
    btcPrice: tokenPrice,
    sections: {
      strategies: strategyItems,
      events: eventItems,
      signals: signalItems,
      allocations,
    },
  };
}

"use client";

import { formatCurrency } from "@/utils";

import {
    calculatePercentages,
    getStrategyDisplayName,
} from "../utils/strategyDisplay";
import { AllocationBar } from "./AllocationBar";

const SIGNAL_TO_EVENT_KEY: Record<string, string> = {
  "Buy Spot": "buy_spot",
  "Sell Spot": "sell_spot",
  "Buy LP": "buy_lp",
  "Sell LP": "sell_lp",
};

const KNOWN_SIGNALS = ["Sentiment", "VIX"];

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

/**
 * Custom Tooltip component that renders date label only once
 * and properly formats all chart data entries.
 * Shows which strategies triggered trading signals.
 */
export function BacktestTooltip({
  active,
  payload,
  label,
  sortedStrategyIds,
}: BacktestTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

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
          portfolio_constituant?: {
            spot: Record<string, number> | number;
            lp: Record<string, number> | number;
            stable: number;
          };
        }
      >
    | undefined;

  const orderedIds = (() => {
    const keys = Object.keys(strategies ?? {});
    if (!sortedStrategyIds?.length) return keys;
    const fromSorted = sortedStrategyIds.filter(id => strategies?.[id]);
    const rest = keys.filter(id => !fromSorted.includes(id));
    return [...fromSorted, ...rest];
  })();

  const allocationBlocks = orderedIds
    .map(id => {
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
    .filter(
      (
        b
      ): b is {
        id: string;
        displayName: string;
        constituents: {
          spot: Record<string, number> | number;
          stable: number;
          lp: Record<string, number> | number;
        };
        spotBreakdown: string | null;
        index: number | undefined;
      } => b != null
    );

  const showAllocation = allocationBlocks.length > 0;

  // Group payload items
  const strategyItems: typeof payload = [];
  const eventItems: typeof payload = [];
  const signalItems: typeof payload = [];

  for (const entry of payload) {
    const name = entry.name || "";
    if (KNOWN_SIGNALS.includes(name)) {
      signalItems.push(entry);
    } else if (SIGNAL_TO_EVENT_KEY[name]) {
      eventItems.push(entry);
    } else {
      strategyItems.push(entry);
    }
  }

  const showSignals = signalItems.length > 0;

  return (
    <div className="bg-[#111827] border border-[#374151] rounded-lg p-3 shadow-lg min-w-[200px]">
      <div className="text-xs font-medium text-white mb-2">{dateStr}</div>
      {tokenPrice != null && (
        <div className="text-xs text-gray-400 mb-2">
          BTC Price:{" "}
          {formatCurrency(tokenPrice, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      )}
      <div className="space-y-1">
        {strategyItems.map((entry, index) => {
          if (!entry || typeof entry.value !== "number") return null;
          return (
            <div
              key={index}
              className="text-xs"
              style={{ color: entry.color || "#fff" }}
            >
              {entry.name}: ${entry.value.toLocaleString()}
            </div>
          );
        })}

        {eventItems.map((entry, index) => {
          if (!entry?.value) return null;
          const name = entry.name || "";
          const eventKey = SIGNAL_TO_EVENT_KEY[name] ?? "";
          if (!eventKey) return null;

          const strategyList = eventStrategies?.[eventKey] || [];
          const strategiesStr =
            strategyList.length > 0 ? ` (${strategyList.join(", ")})` : "";

          return (
            <div
              key={`evt-${index}`}
              className="text-xs font-medium"
              style={{ color: entry.color || "#fff" }}
            >
              {name}
              {strategiesStr}
            </div>
          );
        })}
      </div>

      {showSignals && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
            Signals
          </div>
          {signalItems.map((entry, index) => {
            if (!entry) return null;
            const name = entry.name || "";
            const value = entry.value;

            let displayValue = String(value);
            if (name === "Sentiment") {
              const label = sentiment
                ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
                : "Unknown";
              displayValue = `${label} (${value})`;
            } else if (typeof value === "number") {
              displayValue = value.toFixed(2);
            }

            return (
              <div
                key={`sig-${index}`}
                className="text-xs flex justify-between gap-4"
                style={{ color: entry.color || "#fff" }}
              >
                <span>{name}</span>
                <span className="font-mono">{displayValue}</span>
              </div>
            );
          })}
        </div>
      )}

      {showAllocation && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
          {allocationBlocks.map(block => (
            <div key={block.id} className="flex flex-col gap-0.5">
              <AllocationBar
                displayName={block.displayName}
                constituents={block.constituents}
                strategyId={block.id}
                index={block.index}
              />
              {block.spotBreakdown && (
                <div className="text-[8px] text-gray-500 pl-4">
                  Spot: {block.spotBreakdown}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

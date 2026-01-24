"use client";

import { formatCurrency } from "@/utils";

import {
  calculatePercentages,
  getStrategyColor,
  getStrategyDisplayName,
} from "../utils/strategyDisplay";

const SIGNAL_TO_EVENT_KEY: Record<string, string> = {
  "Buy Spot": "buy_spot",
  "Sell Spot": "sell_spot",
  "Buy LP": "buy_lp",
  "Sell LP": "sell_lp",
};

export interface BacktestTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: Record<string, unknown> }>;
  label?: string | number;
  /** Strategy IDs in chart legend order. If provided, allocation bars use this order. */
  sortedStrategyIds?: string[];
}

function AllocationBar({
  displayName,
  percentages,
  strategyId,
}: {
  displayName: string;
  percentages: { spot: number; stable: number; lp: number };
  strategyId?: string;
}) {
  const hasAny = percentages.spot > 0 || percentages.stable > 0 || percentages.lp > 0;
  if (!hasAny) return null;

  const color = strategyId != null ? getStrategyColor(strategyId) : undefined;

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5">
        {color != null && (
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        {displayName}
      </div>
      <div className="flex h-3 rounded overflow-hidden relative">
        {percentages.spot > 0 && (
          <div
            className="bg-blue-500 flex items-center justify-center min-w-[2px]"
            style={{ width: `${Math.max(percentages.spot, 0.5)}%` }}
          >
            {percentages.spot > 8 && (
              <span className="text-[8px] text-white font-medium whitespace-nowrap">
                {percentages.spot.toFixed(0)}%
              </span>
            )}
          </div>
        )}
        {percentages.stable > 0 && (
          <div
            className="bg-gray-500 flex items-center justify-center min-w-[2px]"
            style={{ width: `${Math.max(percentages.stable, 0.5)}%` }}
          >
            {percentages.stable > 8 && (
              <span className="text-[8px] text-white font-medium whitespace-nowrap">
                {percentages.stable.toFixed(0)}%
              </span>
            )}
          </div>
        )}
        {percentages.lp > 0 && (
          <div
            className="bg-cyan-500 flex items-center justify-center min-w-[2px]"
            style={{ width: `${Math.max(percentages.lp, 0.5)}%` }}
          >
            {percentages.lp > 8 && (
              <span className="text-[8px] text-white font-medium whitespace-nowrap">
                {percentages.lp.toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-2 text-[8px] text-gray-500">
        <span>Spot: {percentages.spot.toFixed(1)}%</span>
        <span>Stable: {percentages.stable.toFixed(1)}%</span>
        <span>LP: {percentages.lp.toFixed(1)}%</span>
      </div>
    </div>
  );
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
  const firstPayload = payload[0]?.payload as Record<string, unknown> | undefined;
  const sentiment = firstPayload?.["sentiment_label"] as string | undefined;

  const sentimentStr = sentiment
    ? ` (${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)})`
    : "";

  const tokenPrice = (firstPayload?.["token_price"] as { btc?: number } | undefined)?.btc ??
    (firstPayload?.["price"] as number | undefined);

  const eventStrategies = firstPayload?.["eventStrategies"] as
    | Record<string, string[]>
    | undefined;

  const strategies = firstPayload?.["strategies"] as Record<
    string,
    { portfolio_constituant?: { spot: number; lp: number; stable: number } }
  > | undefined;

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
      const hasAny = percentages.spot > 0 || percentages.stable > 0 || percentages.lp > 0;
      if (!hasAny) return null;
      return {
        id,
        displayName: getStrategyDisplayName(id),
        percentages,
      };
    })
    .filter((b): b is NonNullable<typeof b> => b != null);

  const showAllocation = allocationBlocks.length > 0;

  return (
    <div
      className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg"
      style={{
        backgroundColor: "#111827",
        borderColor: "#374151",
        borderRadius: "0.5rem",
      }}
    >
      <div className="text-xs font-medium text-white mb-2">
        {dateStr}
        {sentimentStr}
      </div>
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
        {payload.map((entry, index) => {
          if (!entry) return null;

          const name = entry.name || "";
          const value = entry.value;

          if (SIGNAL_TO_EVENT_KEY[name]) {
            if (value) {
              const eventKey = SIGNAL_TO_EVENT_KEY[name];
              const strategyList = eventStrategies?.[eventKey] || [];
              const strategiesStr =
                strategyList.length > 0 ? ` (${strategyList.join(", ")})` : "";

              return (
                <div
                  key={index}
                  className="text-xs"
                  style={{ color: entry.color || "#fff" }}
                >
                  {name}
                  {strategiesStr}
                </div>
              );
            }
            return null;
          }

          if (typeof value === "number") {
            return (
              <div
                key={index}
                className="text-xs"
                style={{ color: entry.color || "#fff" }}
              >
                {name}: ${value.toLocaleString()}
              </div>
            );
          }

          return null;
        })}
      </div>

      {showAllocation && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
          {allocationBlocks.map(({ id, displayName, percentages }) => (
            <AllocationBar
              key={id}
              displayName={displayName}
              percentages={percentages}
              strategyId={id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

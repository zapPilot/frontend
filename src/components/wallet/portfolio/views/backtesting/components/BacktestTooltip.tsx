"use client";

import { formatCurrency } from "@/utils";

import { calculatePercentages } from "../utils/strategyDisplay";

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
  const smartDca = strategies?.["smart_dca"];
  const dcaClassic = strategies?.["dca_classic"];
  const smartConstituents = smartDca?.portfolio_constituant;
  const classicConstituents = dcaClassic?.portfolio_constituant;

  const smartPercentages = smartConstituents
    ? calculatePercentages(smartConstituents)
    : null;
  const classicPercentages = classicConstituents
    ? calculatePercentages(classicConstituents)
    : null;

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

      {(smartPercentages || classicPercentages) && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
          {classicPercentages && (
            <div className="space-y-1">
              <div className="text-[10px] text-gray-400 font-medium">
                Normal DCA
              </div>
              <div className="flex h-3 rounded overflow-hidden relative">
                {classicPercentages.spot > 0 && (
                  <div
                    className="bg-blue-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(classicPercentages.spot, 0.5)}%`,
                    }}
                  >
                    {classicPercentages.spot > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {classicPercentages.spot.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
                {classicPercentages.stable > 0 && (
                  <div
                    className="bg-gray-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(classicPercentages.stable, 0.5)}%`,
                    }}
                  >
                    {classicPercentages.stable > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {classicPercentages.stable.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
                {classicPercentages.lp > 0 && (
                  <div
                    className="bg-cyan-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(classicPercentages.lp, 0.5)}%`,
                    }}
                  >
                    {classicPercentages.lp > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {classicPercentages.lp.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 text-[8px] text-gray-500">
                <span>Spot: {classicPercentages.spot.toFixed(1)}%</span>
                <span>Stable: {classicPercentages.stable.toFixed(1)}%</span>
                <span>LP: {classicPercentages.lp.toFixed(1)}%</span>
              </div>
            </div>
          )}

          {smartPercentages && (
            <div className="space-y-1">
              <div className="text-[10px] text-gray-400 font-medium">
                Regime Strategy
              </div>
              <div className="flex h-3 rounded overflow-hidden relative">
                {smartPercentages.spot > 0 && (
                  <div
                    className="bg-blue-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(smartPercentages.spot, 0.5)}%`,
                    }}
                  >
                    {smartPercentages.spot > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {smartPercentages.spot.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
                {smartPercentages.stable > 0 && (
                  <div
                    className="bg-gray-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(smartPercentages.stable, 0.5)}%`,
                    }}
                  >
                    {smartPercentages.stable > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {smartPercentages.stable.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
                {smartPercentages.lp > 0 && (
                  <div
                    className="bg-cyan-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(smartPercentages.lp, 0.5)}%`,
                    }}
                  >
                    {smartPercentages.lp > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {smartPercentages.lp.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 text-[8px] text-gray-500">
                <span>Spot: {smartPercentages.spot.toFixed(1)}%</span>
                <span>Stable: {smartPercentages.stable.toFixed(1)}%</span>
                <span>LP: {smartPercentages.lp.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

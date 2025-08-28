"use client";

import { useMemo } from "react";
import { formatSmallNumber } from "../../utils/formatters";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { SwapEvent } from "../../types/api";

interface EventsListProps {
  events: SwapEvent[];
  showTechnicalDetails: boolean;
}

interface TradingImpact {
  isGain: boolean;
  isBreakEven: boolean;
  colorClass: string;
  label: string;
}

// Helper function to calculate trading impact status and styling
function calculateTradingImpact(netLoss: number): TradingImpact {
  const isGain = netLoss < 0; // Negative = gain
  const isBreakEven = Math.abs(netLoss) < 0.01;

  if (isBreakEven) {
    return {
      isGain: false,
      isBreakEven: true,
      colorClass: "text-gray-400",
      label: "Break Even",
    };
  } else if (isGain) {
    return {
      isGain: true,
      isBreakEven: false,
      colorClass: "text-green-400",
      label: "Arbitrage +",
    };
  } else {
    return {
      isGain: false,
      isBreakEven: false,
      colorClass: "text-red-400",
      label: "Loss -",
    };
  }
}

export function EventsList({ events, showTechnicalDetails }: EventsListProps) {
  // Memoize event filtering to avoid recalculating on every render
  const filteredEvents = useMemo(() => {
    return events.filter(
      event => event.type === "token_ready" && event.provider
    );
  }, [events]);

  // Don't render if no events to show
  if (filteredEvents.length === 0) {
    return null;
  }

  return (
    <div className="max-h-64 overflow-y-auto space-y-2">
      {filteredEvents.map((event, index) => {
        const tradingLoss = event.tradingLoss;
        const inputValue = tradingLoss?.inputValueUSD || 0;
        const outputValue = tradingLoss?.outputValueUSD || 0;
        const netLoss = tradingLoss?.netLossUSD || 0;
        const lossPercentage = tradingLoss?.lossPercentage || 0;
        const gasCost = event.gasCostUSD || 0;

        // Calculate trading impact for this event
        const tradingImpact = calculateTradingImpact(netLoss);

        return (
          <div
            key={index}
            className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30"
          >
            {/* Main conversion info */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ImageWithFallback
                  src={`https://zap-assets-worker.davidtnfsh.workers.dev/tokenPictures/${event.tokenSymbol?.toLowerCase()}.webp`}
                  alt={event.tokenSymbol || "Token"}
                  fallbackType="token"
                  symbol={event.tokenSymbol || "Token"}
                  size={20}
                />
                <span className="font-medium text-blue-300 text-sm">
                  {event.tokenSymbol || "Token"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">via</span>
                <ImageWithFallback
                  src={`https://zap-assets-worker.davidtnfsh.workers.dev/projectPictures/${event.provider?.toLowerCase()}.webp`}
                  alt={event.provider || "Provider"}
                  fallbackType="project"
                  symbol={event.provider}
                  size={16}
                />
                <span className="text-green-400 text-sm">{event.provider}</span>
              </div>
            </div>

            {/* Simplified info - always visible */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">
                ${formatSmallNumber(inputValue)} converted
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${tradingImpact.colorClass}`}>
                  {tradingImpact.label} ${formatSmallNumber(Math.abs(netLoss))}
                </span>
                <span className="text-green-400">✓</span>
              </div>
            </div>

            {/* Technical details - only when expanded */}
            {showTechnicalDetails && (
              <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Input Value:</span>
                  <span>${formatSmallNumber(inputValue)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Output Value:</span>
                  <span>${formatSmallNumber(outputValue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>
                    {tradingImpact.isBreakEven
                      ? "Trading Impact:"
                      : tradingImpact.isGain
                        ? "Arbitrage Gain:"
                        : "Trading Loss:"}
                  </span>
                  <span className={tradingImpact.colorClass}>
                    {tradingImpact.isGain ? "+" : ""}$
                    {formatSmallNumber(Math.abs(netLoss))} (
                    {lossPercentage >= 0 ? "" : "+"}
                    {formatSmallNumber(Math.abs(lossPercentage))}
                    %)
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Gas Cost:</span>
                  <span>${formatSmallNumber(gasCost)}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo } from "react";
import { formatSmallNumber } from "../../utils/formatters";

interface TradingSummaryProps {
  events: any[];
  showTechnicalDetails: boolean;
  onToggleTechnicalDetails: () => void;
}

interface TradingData {
  inputValue: number;
  outputValue: number;
  tradingLoss: number;
  isGain: boolean;
  isBreakEven: boolean;
}

export function TradingSummary({
  events,
  showTechnicalDetails,
  onToggleTechnicalDetails,
}: TradingSummaryProps) {
  // Memoize expensive calculations to avoid recalculating on every render
  const tradingData = useMemo((): TradingData => {
    const validEvents = events.filter(
      (e: any) => e.type === "token_ready" && e.tradingLoss
    );

    const inputValue = validEvents.reduce(
      (sum, e: any) => sum + (e.tradingLoss?.inputValueUSD || 0),
      0
    );

    const outputValue = validEvents.reduce(
      (sum, e: any) => sum + (e.tradingLoss?.outputValueUSD || 0),
      0
    );

    const tradingLoss = validEvents.reduce(
      (sum, e: any) => sum + (e.tradingLoss?.netLossUSD || 0),
      0
    );

    const isGain = tradingLoss < 0; // Negative = gain
    const isBreakEven = Math.abs(tradingLoss) < 0.01;

    return {
      inputValue,
      outputValue,
      tradingLoss,
      isGain,
      isBreakEven,
    };
  }, [events]);

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700/50">
      <div className="grid grid-cols-3 gap-4 mb-3">
        {/* Total Input Value */}
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">Input Value</div>
          <div className="font-semibold text-blue-400">
            ${formatSmallNumber(tradingData.inputValue)}
          </div>
        </div>

        {/* Total Output Value */}
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">Output Value</div>
          <div className="font-semibold text-green-400">
            ${formatSmallNumber(tradingData.outputValue)}
          </div>
        </div>

        {/* Trading Impact */}
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">Trading Impact</div>
          <div
            className={`font-semibold ${
              tradingData.isBreakEven
                ? "text-gray-400"
                : tradingData.isGain
                  ? "text-green-400"
                  : "text-red-400"
            }`}
          >
            {tradingData.isGain ? "+" : ""}$
            {formatSmallNumber(Math.abs(tradingData.tradingLoss))}
            <div className="text-xs mt-1">
              {tradingData.isBreakEven
                ? "Break Even"
                : tradingData.isGain
                  ? "Arbitrage Gain"
                  : "Trading Loss"}
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details Toggle */}
      <button
        onClick={onToggleTechnicalDetails}
        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        {showTechnicalDetails ? (
          <ChevronUp size={16} />
        ) : (
          <ChevronDown size={16} />
        )}
        {showTechnicalDetails ? "Hide" : "Show"} Technical Details
      </button>
    </div>
  );
}

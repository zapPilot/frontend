"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  ChevronRight,
  GitMerge,
  LineChart,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import type { TradeSuggestion } from "@/types/strategy";
import { cn } from "@/lib/ui/classNames";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TradeSuggestion[];
  totalValue: number;
}

// --- Helpers ---

const usePortfolioState = (trades: TradeSuggestion[], totalValue: number) => {
  const current = {
    spot: 0.45,
    lp: 0.15,
    stable: 0.4,
  };
  const target = {
    spot: 0.55,
    lp: 0.35,
    stable: 0.1,
  };
  return { current, target };
};

const enrichTradeSteps = (trade: TradeSuggestion, index: number) => {
  const isBuy = trade.action === "buy";
  const asset =
    trade.bucket === "spot"
      ? "BTC"
      : trade.bucket === "stable"
        ? "USDC"
        : "BTC-USDC LP";

  // Mock logic to determine chain flow
  const sourceChain = isBuy ? "Arbitrum" : "Ethereum";
  const targetChain = isBuy ? "Ethereum" : "Arbitrum";
  const protocol = isBuy ? "Uniswap V3" : "Aave V3";

  // Generate steps based on action
  const steps = [];

  if (trade.action === "sell") {
    steps.push({
      label: `Withdraw ${asset}`,
      detail: `from ${protocol} (${sourceChain})`,
      icon: ArrowRightLeft,
    });
    steps.push({
      label: `Bridge Funds`,
      detail: `via Across Protocol to ${targetChain}`,
      icon: GitMerge,
    });
    steps.push({
      label: `Swap to USDC`,
      detail: `on 1inch Aggregator`,
      icon: ArrowRight,
    });
  } else {
    steps.push({
      label: `Bridge USDC`,
      detail: `via Stargate to ${targetChain}`,
      icon: GitMerge,
    });
    steps.push({
      label: `Buy ${asset}`,
      detail: `on ${protocol}`,
      icon: ArrowRight,
    });
    steps.push({
      label: `Deposit`,
      detail: `into Strategy Vault`,
      icon: ShieldCheck,
    });
  }

  return { ...trade, steps, protocol, sourceChain, targetChain, asset };
};

// --- Components ---

function RegimeContext() {
  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 flex items-start gap-4">
      <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
        <LineChart className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
          Uptrend Detected
          <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-mono uppercase">
            Bullish
          </span>
        </h4>
        <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">
          BTC Price{" "}
          <strong className="font-mono text-indigo-900 dark:text-white">
            $65,400
          </strong>{" "}
          is above the 200-Day Moving Average{" "}
          <strong className="font-mono text-indigo-900 dark:text-white">
            ($58,200)
          </strong>
          . Strategy recommends increasing Spot exposure.
        </p>
      </div>
    </div>
  );
}

function ImpactVisual({
  trades,
  totalValue,
}: {
  trades: TradeSuggestion[];
  totalValue: number;
}) {
  const { current, target } = usePortfolioState(trades, totalValue);

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
        Allocation Impact
      </h4>
      <div className="flex justify-center gap-12 items-end h-48 px-8">
        {/* Current Bar */}
        <div className="w-20 h-full flex flex-col justify-end group">
          <div className="text-[10px] text-center text-gray-400 mb-2 font-medium uppercase">
            Current
          </div>
          <div className="w-full h-full rounded-xl overflow-hidden flex flex-col-reverse shadow-sm opacity-80">
            <div
              style={{ height: `${current.spot * 100}%` }}
              className="bg-orange-500/80 w-full relative group/segment flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white opacity-0 group-hover/segment:opacity-100">
                SPOT
              </span>
            </div>
            <div
              style={{ height: `${current.lp * 100}%` }}
              className="bg-purple-500/80 w-full relative group/segment flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white opacity-0 group-hover/segment:opacity-100">
                LP
              </span>
            </div>
            <div
              style={{ height: `${current.stable * 100}%` }}
              className="bg-emerald-500/80 w-full relative group/segment flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white opacity-0 group-hover/segment:opacity-100">
                USD
              </span>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center justify-center pb-8 opacity-30">
          <ArrowRight className="w-6 h-6 text-gray-400" />
        </div>

        {/* Target Bar */}
        <div className="w-20 h-full flex flex-col justify-end group">
          <div className="text-[10px] text-center text-indigo-500 mb-2 font-bold uppercase">
            Target
          </div>
          <div className="w-full h-full rounded-xl overflow-hidden flex flex-col-reverse shadow-lg ring-2 ring-indigo-500/20">
            <div
              style={{ height: `${target.spot * 100}%` }}
              className="bg-orange-500 w-full relative group/segment flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white">
                {(target.spot * 100).toFixed(0)}%
              </span>
            </div>
            <div
              style={{ height: `${target.lp * 100}%` }}
              className="bg-purple-500 w-full relative group/segment flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white">
                {(target.lp * 100).toFixed(0)}%
              </span>
            </div>
            <div
              style={{ height: `${target.stable * 100}%` }}
              className="bg-emerald-500 w-full relative group/segment flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white">
                {(target.stable * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutionTimeline({ trades }: { trades: TradeSuggestion[] }) {
  const enrichedTrades = trades.map(enrichTradeSteps);

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        Execution Route
      </h4>
      <div className="relative pl-4">
        {/* Timeline Line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-800 to-transparent" />

        {enrichedTrades.map((t, i) => (
          <div key={i} className="relative pl-10 pb-8 last:pb-0">
            {/* Trade Node */}
            <div className="absolute left-3 top-0 w-6 h-6 rounded-full bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 z-10 flex items-center justify-center">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  t.action === "buy" ? "bg-green-500" : "bg-red-500"
                )}
              />
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm">
              {/* Trade Header */}
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold uppercase px-1.5 py-0.5 rounded",
                      t.action === "buy"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    )}
                  >
                    {t.action}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {t.asset}
                  </span>
                </div>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                  {formatCurrency(t.amount_usd)}
                </span>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {t.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <step.icon className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-200 block">
                        {step.label}
                      </span>
                      <span className="text-gray-500">{step.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Modal ---

export function ReviewModal({
  isOpen,
  onClose,
  trades,
  totalValue,
}: ReviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-black w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-black z-20">
          <div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Confirm Strategy
            </h3>
            <p className="text-sm text-gray-500">Review rebalancing plan.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (Unified Flow) */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          <RegimeContext />
          <ImpactVisual trades={trades} totalValue={totalValue} />
          <div className="border-t border-dashed border-gray-200 dark:border-gray-800" />
          <ExecutionTimeline trades={trades} />
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
          <button className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2">
            Confirm & Sign Bundle
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

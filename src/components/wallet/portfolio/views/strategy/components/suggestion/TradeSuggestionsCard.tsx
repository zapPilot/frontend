"use client";

import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/ui/classNames";
import type {
  PacingInfo,
  TradeActionType,
  TradeSuggestion,
} from "@/types/strategy";
import { formatCurrency } from "@/utils/formatters";

interface TradeSuggestionsCardProps {
  trades: TradeSuggestion[];
  pacing: PacingInfo | null;
  patternReason?: string | null;
}

const ACTION_STYLES: Record<
  TradeActionType,
  {
    bg: string;
    border: string;
    text: string;
    icon: typeof TrendingUp;
    label: string;
  }
> = {
  buy: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    icon: TrendingUp,
    label: "BUY",
  },
  sell: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
    icon: TrendingDown,
    label: "SELL",
  },
  hold: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    text: "text-gray-400",
    icon: Minus,
    label: "HOLD",
  },
};

function TradeRow({ trade }: { trade: TradeSuggestion }) {
  const style = ACTION_STYLES[trade.action];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between p-4 rounded-xl border bg-gray-800/40 hover:bg-gray-800/60 transition-all",
        "border-gray-800 hover:border-gray-700 hover:shadow-lg hover:shadow-black/20"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Action Badge */}
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full border shadow-inner",
            style.bg,
            style.border,
            style.text
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={cn("font-bold text-sm tracking-wide", style.text)}>
              {style.label}
            </span>
            <span className="text-white font-medium capitalize">
              {trade.bucket.replace(/_/g, " ")}
            </span>
          </div>

          {/* Flow detail */}
          {(trade.from_bucket || trade.to_bucket) && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
              {trade.from_bucket && (
                <>
                  <span className="capitalize">{trade.from_bucket}</span>
                  <ArrowRight className="w-3 h-3 opacity-50" />
                </>
              )}
              {trade.to_bucket && (
                <span className="capitalize">{trade.to_bucket}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <div
          className={cn(
            "font-bold text-lg tabular-nums tracking-tight",
            trade.action === "buy" ? "text-emerald-400" : "",
            trade.action === "sell" ? "text-rose-400" : "",
            trade.action === "hold" ? "text-gray-400" : ""
          )}
        >
          {trade.action === "buy" ? "+" : trade.action === "sell" ? "-" : ""}
          {formatCurrency(trade.amount_usd)}
        </div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
          USD Value
        </div>
      </div>
    </div>
  );
}

function PacingHeader({ pacing }: { pacing: PacingInfo }) {
  const convergencePctFormatted = Math.round(pacing.convergence_pct);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 mb-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
      <div className="flex items-center gap-3 text-sm text-blue-300">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Clock className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <span className="font-bold text-blue-200 block">
            Pacing Plan Active
          </span>
          <span className="text-xs text-blue-400/80">
            Gradual rebalancing to reduce impact
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex flex-col items-end">
          <div className="text-gray-400 mb-1">Current Step</div>
          <div className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-200 font-mono border border-blue-500/20">
            <span className="font-bold text-white">1</span> /{" "}
            {pacing.total_steps}
          </div>
        </div>
        <div className="w-px h-8 bg-blue-500/20" />
        <div className="flex flex-col items-end">
          <div className="text-gray-400 mb-1">Target Moved</div>
          <div className="font-mono text-white bg-gray-800/50 px-2 py-1 rounded border border-gray-700">
            {convergencePctFormatted}%
          </div>
        </div>
      </div>
    </div>
  );
}

export function TradeSuggestionsCard({
  trades,
  pacing,
  patternReason,
}: Omit<TradeSuggestionsCardProps, "totalValue">) {
  // Calculate total trade volume
  const totalTradeVolume = trades.reduce((sum, t) => sum + t.amount_usd, 0);

  // Empty state - no trades today
  if (trades.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <SectionHeader title="Action Plan" />
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-800 rounded-xl bg-gray-900/20 mt-4">
          <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4 ring-1 ring-white/5 shadow-xl">
            <Minus className="w-8 h-8 text-gray-500" />
          </div>
          <h4 className="text-white font-medium mb-2 text-lg">
            No Actions Needed
          </h4>
          <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed">
            Your portfolio is currently optimized for the{" "}
            <span className="text-gray-300 font-medium">
              {patternReason ? "current market" : "regime"}
            </span>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Action Plan</h3>
          <p className="text-xs text-gray-400 mt-1">
            Recommended trades to rebalance
          </p>
        </div>
        {totalTradeVolume > 0 && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">
              Total Volume
            </span>
            <span className="text-sm font-bold text-white font-mono bg-gray-800/80 px-2 py-1 rounded border border-gray-700">
              {formatCurrency(totalTradeVolume)}
            </span>
          </div>
        )}
      </div>

      {/* Pacing info */}
      {pacing && <PacingHeader pacing={pacing} />}

      {/* Pattern reason context */}
      {patternReason && !pacing && (
        <div className="mb-4 px-3 py-2 bg-gray-800/30 rounded-lg border-l-2 border-gray-600">
          <p className="text-xs text-gray-400">
            <span className="text-gray-500 font-medium uppercase tracking-wider mr-2">
              Strategy
            </span>
            {patternReason}
          </p>
        </div>
      )}

      {/* Trade list */}
      <div className="space-y-3 flex-1">
        {trades.map((trade, index) => (
          <TradeRow key={`${trade.bucket}-${index}`} trade={trade} />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 mt-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-amber-500/80 mt-0.5 flex-shrink-0" />
        <p className="text-xs leading-relaxed text-amber-200/60">
          These are algorithmic suggestions based on your strategy settings.
          Please review carefully before executing trades on your preferred
          platform.
        </p>
      </div>
    </div>
  );
}

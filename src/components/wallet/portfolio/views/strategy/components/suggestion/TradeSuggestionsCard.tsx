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
  totalValue: number;
  patternReason?: string | null;
}

const ACTION_STYLES: Record<
  TradeActionType,
  {
    bg: string;
    border: string;
    icon: typeof TrendingUp;
    iconColor: string;
    label: string;
  }
> = {
  buy: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: TrendingUp,
    iconColor: "text-green-400",
    label: "BUY",
  },
  sell: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: TrendingDown,
    iconColor: "text-red-400",
    label: "SELL",
  },
  hold: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    icon: Minus,
    iconColor: "text-gray-400",
    label: "HOLD",
  },
};

function TradeRow({ trade }: { trade: TradeSuggestion }) {
  const style = ACTION_STYLES[trade.action];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border",
        style.bg,
        style.border
      )}
    >
      <div className="flex items-center gap-3">
        {/* Action icon with label */}
        <div className={cn("flex items-center gap-2", style.iconColor)}>
          <Icon className="w-5 h-5" />
          <span className="font-semibold text-sm uppercase tracking-wide">
            {style.label}
          </span>
        </div>

        {/* Bucket name */}
        <span className="text-white font-medium capitalize">
          {trade.bucket}
        </span>

        {/* Flow direction (from → to) */}
        {trade.from_bucket && trade.to_bucket && (
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <span className="capitalize">{trade.from_bucket}</span>
            <ArrowRight className="w-3 h-3" />
            <span className="capitalize">{trade.to_bucket}</span>
          </span>
        )}
      </div>

      {/* Amount */}
      <div className="text-right">
        <span
          className={cn(
            "font-semibold text-lg",
            trade.action === "buy" ? "text-green-400" : "",
            trade.action === "sell" ? "text-red-400" : "",
            trade.action === "hold" ? "text-gray-400" : ""
          )}
        >
          {trade.action === "buy" ? "+" : trade.action === "sell" ? "-" : ""}
          {formatCurrency(trade.amount_usd)}
        </span>
      </div>
    </div>
  );
}

function PacingHeader({ pacing }: { pacing: PacingInfo }) {
  // Calculate current step (use convergence_pct as approximation for display)
  // Since we don't have step number directly, use "Move X% of delta" as the primary info
  const convergencePctFormatted = Math.round(pacing.convergence_pct);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400 mb-4">
      <div className="flex items-center gap-1.5">
        <span className="text-white font-medium">{pacing.total_steps}</span>
        <span>total steps</span>
      </div>

      <span className="text-gray-600">|</span>

      <div className="flex items-center gap-1.5">
        <span>Move</span>
        <span className="text-white font-medium">
          {convergencePctFormatted}%
        </span>
        <span>of delta</span>
      </div>

      <span className="text-gray-600">|</span>

      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        <span>Every</span>
        <span className="text-white font-medium">{pacing.interval_days}</span>
        <span>days</span>
      </div>
    </div>
  );
}

export function TradeSuggestionsCard({
  trades,
  pacing,
  totalValue,
  patternReason,
}: TradeSuggestionsCardProps) {
  // Calculate total trade volume
  const totalTradeVolume = trades.reduce((sum, t) => sum + t.amount_usd, 0);
  const volumePercent =
    totalValue > 0 ? (totalTradeVolume / totalValue) * 100 : 0;

  // Empty state - no trades today
  if (trades.length === 0) {
    return (
      <div className="space-y-4">
        <SectionHeader title="Today's Trades" />
        <div className="flex flex-col items-center justify-center py-8 text-center border border-gray-700/50 rounded-lg bg-gray-800/30">
          <Minus className="w-8 h-8 text-gray-500 mb-2" />
          <p className="text-gray-400">No trades needed today</p>
          <p className="text-sm text-gray-500 mt-1">
            Your portfolio is within the target allocation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <SectionHeader
        title="Today's Trades"
        rightContent={
          totalTradeVolume > 0 ? (
            <span className="text-sm text-gray-400">
              Trade volume: {formatCurrency(totalTradeVolume)} (
              {volumePercent.toFixed(1)}% of holdings)
            </span>
          ) : undefined
        }
      />

      {/* Pacing info */}
      {pacing && <PacingHeader pacing={pacing} />}

      {/* Pattern reason context */}
      {patternReason && (
        <p className="text-sm text-gray-400 italic mb-2">
          &ldquo;{patternReason}&rdquo;
        </p>
      )}

      {/* Trade list */}
      <div className="space-y-3">
        {trades.map((trade, index) => (
          <TradeRow key={`${trade.bucket}-${index}`} trade={trade} />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-yellow-200/80">
          These are suggestions only. Execute trades manually on your preferred
          platform.
        </p>
      </div>
    </div>
  );
}

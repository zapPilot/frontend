"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Layout,
  ListOrdered,
  X,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import type { TradeSuggestion } from "@/types/strategy";
import { cn } from "@/lib/ui/classNames";

type ReviewVariation = "receipt" | "impact" | "timeline";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TradeSuggestion[];
  totalValue: number;
}

// --- Variation 1: The Receipt ---
function ReceiptView({ trades }: { trades: TradeSuggestion[] }) {
  const totalVolume = trades.reduce((sum, t) => sum + t.amount_usd, 0);
  const estimatedFees = totalVolume * 0.001; // Mock fee calculation

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 font-mono text-sm border border-gray-200 dark:border-gray-800 relative overflow-hidden">
        {/* Receipt Decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent opacity-50" />

        <div className="flex justify-between text-gray-500 mb-6 pb-4 border-b border-dashed border-gray-300 dark:border-gray-700">
          <span>ORDER #2024-8X92</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>

        <div className="space-y-3 mb-6">
          {trades.map((trade, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex gap-2">
                <span
                  className={cn(
                    "font-bold uppercase",
                    trade.action === "buy"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {trade.action}
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {trade.bucket.toUpperCase().replace("_", " ")}
                </span>
              </div>
              <span className="text-gray-900 dark:text-white">
                {formatCurrency(trade.amount_usd)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-dashed border-gray-300 dark:border-gray-700 space-y-2">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(totalVolume)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Est. Network Fee</span>
            <span>{formatCurrency(estimatedFees)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2">
            <span>Total</span>
            <span>{formatCurrency(totalVolume + estimatedFees)}</span>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        All transactions will be executed securely on-chain.
      </p>
    </div>
  );
}

// --- Variation 2: The Impact ---
function ImpactView({
  trades,
  totalValue,
}: {
  trades: TradeSuggestion[];
  totalValue: number;
}) {
  // Mock calculation of 'current' vs 'new' based on trades
  // In a real app this would use the real allocation data passed down
  const buyVolume = trades
    .filter(t => t.action === "buy")
    .reduce((s, t) => s + t.amount_usd, 0);
  const sellVolume = trades
    .filter(t => t.action === "sell")
    .reduce((s, t) => s + t.amount_usd, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 items-center">
        {/* Before */}
        <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4 text-center border border-transparent dark:border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Current State
          </div>
          <div className="h-32 flex items-end justify-center gap-1 mb-2">
            <div className="w-8 bg-orange-500/50 h-[60%] rounded-t-lg" />
            <div className="w-8 bg-purple-500/50 h-[30%] rounded-t-lg" />
            <div className="w-8 bg-emerald-500/50 h-[10%] rounded-t-lg" />
          </div>
          <div className="text-xs text-gray-400">Drifting</div>
        </div>

        {/* Arrow */}
        <div className="absolute left-1/2 -ml-3 bg-white dark:bg-gray-800 p-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm z-10">
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* After */}
        <div className="bg-white dark:bg-black rounded-2xl p-4 text-center border-2 border-indigo-500 shadow-lg shadow-indigo-500/10">
          <div className="text-xs text-indigo-500 uppercase tracking-wider mb-2 font-bold">
            Projected
          </div>
          <div className="h-32 flex items-end justify-center gap-1 mb-2">
            <div className="w-8 bg-orange-500 h-[70%] rounded-t-lg" />
            <div className="w-8 bg-purple-500 h-[20%] rounded-t-lg" />
            <div className="w-8 bg-emerald-500 h-[10%] rounded-t-lg" />
          </div>
          <div className="text-xs text-indigo-400 font-medium">Optimized</div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 flex justify-around">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            +{formatCurrency(buyVolume)}
          </div>
          <div className="text-xs text-gray-500 uppercase">Buying Volume</div>
        </div>
        <div className="w-px bg-indigo-200 dark:bg-indigo-800" />
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            -{formatCurrency(sellVolume)}
          </div>
          <div className="text-xs text-gray-500 uppercase">Selling Volume</div>
        </div>
      </div>
    </div>
  );
}

// --- Variation 3: The Timeline ---
function TimelineView({ trades }: { trades: TradeSuggestion[] }) {
  const steps = [
    {
      title: "Approve Tokens",
      desc: "Permission to swap assets",
      icon: CheckCircle2,
    },
    {
      title: "Execute Swaps",
      desc: `${trades.length} trades batched`,
      icon: ArrowRight,
    },
    { title: "Settle Funds", desc: "Confirming balances", icon: Clock },
  ];

  return (
    <div className="space-y-8 py-2">
      <div className="relative">
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-800" />

        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={i} className="relative flex gap-6">
              <div className="relative z-10 w-12 h-12 rounded-full bg-white dark:bg-gray-900 border-4 border-gray-100 dark:border-gray-800 flex items-center justify-center">
                <step.icon
                  className={cn(
                    "w-5 h-5",
                    i === 1 ? "text-indigo-500" : "text-gray-400"
                  )}
                />
              </div>
              <div className="pt-1">
                <h4
                  className={cn(
                    "font-medium text-lg",
                    i === 1
                      ? "text-indigo-500"
                      : "text-gray-900 dark:text-white"
                  )}
                >
                  {step.title}
                </h4>
                <p className="text-sm text-gray-500">{step.desc}</p>

                {/* Specifics for the swap step */}
                {i === 1 && (
                  <div className="mt-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm space-y-2 border border-gray-200 dark:border-gray-800">
                    {trades.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        <span>
                          {t.action === "buy" ? "Buy" : "Sell"}{" "}
                          {t.bucket.toUpperCase()} (
                          {formatCurrency(t.amount_usd)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
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
  const [variation, setVariation] = useState<ReviewVariation>("receipt");

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
              Review Execution
            </h3>
            <p className="text-sm text-gray-500">
              Confirm your rebalancing actions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variation Switcher (For Demo Only) */}
        <div className="px-6 pt-4 flex justify-center">
          <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-lg inline-flex gap-1">
            {[
              { id: "receipt", icon: FileText, label: "Receipt" },
              { id: "impact", icon: Layout, label: "Impact" },
              { id: "timeline", icon: ListOrdered, label: "Timeline" },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setVariation(v.id as ReviewVariation)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  variation === v.id
                    ? "bg-white dark:bg-black text-black dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                )}
              >
                <v.icon className="w-3 h-3" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {variation === "receipt" && <ReceiptView trades={trades} />}
          {variation === "impact" && (
            <ImpactView trades={trades} totalValue={totalValue} />
          )}
          {variation === "timeline" && <TimelineView trades={trades} />}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
          <button className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2">
            Confirm Execution
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

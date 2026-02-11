"use client";

import { CircleDollarSign } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/ui/classNames";
import { formatCurrency } from "@/utils/formatters";

import { useDailySuggestion } from "../hooks/useDailySuggestion";
import { useDefaultPresetId } from "../hooks/useDefaultPresetId";
import { BaseTradingPanel } from "./BaseTradingPanel";

function RebalancePanelSkeleton() {
  return (
    <div
      className="max-w-md mx-auto space-y-12"
      role="status"
      aria-label="Loading rebalance data"
    >
      {/* Header: title + skeleton subtitle */}
      <div className="text-center space-y-2">
        <h3 className="text-4xl font-light text-gray-900 dark:text-white">
          Portfolio Health
        </h3>
        <div className="flex justify-center">
          <div className="h-4 w-40 bg-gray-700/50 rounded animate-pulse" />
        </div>
      </div>

      {/* ActionCard skeleton */}
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl shadow-black/20 border border-gray-100 dark:border-gray-800">
        {/* Header: title + subtitle + icon */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="h-4 w-32 bg-gray-700/50 rounded animate-pulse" />
            <div className="h-6 w-28 bg-gray-700/50 rounded animate-pulse" />
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>

        <div className="space-y-8">
          {/* ImpactVisual placeholder */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="h-40 w-full bg-gray-700/30 rounded-2xl animate-pulse" />
          </div>

          {/* Trade row skeletons */}
          <div className="space-y-4 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 -mx-3"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-gray-600 animate-pulse" />
                  <div className="h-5 w-32 bg-gray-700/50 rounded animate-pulse" />
                </div>
                <div className="h-7 w-20 bg-gray-800/50 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer: disabled CTA */}
        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            disabled
            className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-medium opacity-50 cursor-not-allowed"
          >
            Review & Execute All
          </button>
        </div>
      </div>
    </div>
  );
}

export function RebalancePanel({ userId }: { userId: string }) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const defaultPresetId = useDefaultPresetId(true);

  const { data } = useDailySuggestion(
    userId,
    defaultPresetId ? { config_id: defaultPresetId } : {}
  );

  if (!data) return <RebalancePanelSkeleton />;

  return (
    <BaseTradingPanel
      title="Portfolio Health"
      subtitle={
        <>
          Aligned with{" "}
          <span className="text-gray-900 dark:text-white font-medium capitalize">
            {data.regime.current.replace("_", " ")}
          </span>{" "}
          Regime
        </>
      }
      actionCardTitle={`${data.trade_suggestions.length} Actions`}
      actionCardSubtitle="Suggested Moves"
      actionCardIcon={
        <CircleDollarSign className="w-6 h-6 text-gray-900 dark:text-white" />
      }
      footer={
        <button
          onClick={() => setIsReviewOpen(true)}
          className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity shadow-lg shadow-gray-200 dark:shadow-none"
        >
          Review & Execute All
        </button>
      }
      isReviewOpen={isReviewOpen}
      onCloseReview={() => setIsReviewOpen(false)}
      onConfirmReview={() => setIsReviewOpen(false)}
    >
      <div className="space-y-4 pt-2">
        {data.trade_suggestions.map((trade, i) => (
          <div
            key={i}
            className="flex items-center justify-between group cursor-default p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors -mx-3"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-all group-hover:scale-125 shadow-sm",
                  trade.action === "buy"
                    ? "bg-green-500 shadow-green-200 dark:shadow-none"
                    : trade.action === "sell"
                      ? "bg-red-500 shadow-red-200 dark:shadow-none"
                      : "bg-gray-400"
                )}
              />
              <span className="text-lg font-light text-gray-600 dark:text-gray-300">
                <span className="font-medium text-gray-900 dark:text-white">
                  {trade.action === "buy"
                    ? "Add"
                    : trade.action === "sell"
                      ? "Reduce"
                      : "Hold"}
                </span>{" "}
                <span className="text-gray-400 mx-1">·</span>{" "}
                {trade.bucket.toUpperCase()}
              </span>
            </div>
            <span className="font-mono text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-sm">
              {formatCurrency(trade.amount_usd)}
            </span>
          </div>
        ))}
      </div>
    </BaseTradingPanel>
  );
}

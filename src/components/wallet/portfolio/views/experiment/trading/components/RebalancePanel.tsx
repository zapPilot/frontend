"use client";

import { CircleDollarSign } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/ui/classNames";
import { formatCurrency } from "@/utils/formatters";

import { useDailySuggestion } from "../hooks/useDailySuggestion";
import { useDefaultPresetId } from "../hooks/useDefaultPresetId";
import { BaseTradingPanel } from "./BaseTradingPanel";

export function RebalancePanel({ userId }: { userId: string }) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const defaultPresetId = useDefaultPresetId(true);

  const { data } = useDailySuggestion(
    userId,
    defaultPresetId ? { config_id: defaultPresetId } : {}
  );

  if (!data) return null;

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
      trades={data.trade_suggestions}
      totalValue={data.total_value_usd}
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

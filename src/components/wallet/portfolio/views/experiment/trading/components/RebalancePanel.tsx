"use client";

import { CircleDollarSign, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { useDailySuggestion } from "@/components/wallet/portfolio/views/strategy/hooks/useDailySuggestion";
import { useStrategyConfigs } from "@/components/wallet/portfolio/views/strategy/hooks/useStrategyConfigs";
import { cn } from "@/lib/ui/classNames";
import { formatCurrency } from "@/utils/formatters";

import { ActionCard } from "./ActionCard";
import { ImpactVisual } from "./ImpactVisual";
import { ReviewModal } from "./ReviewModal";

export function RebalancePanel({ userId }: { userId: string }) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: configsResponse } = useStrategyConfigs(true);
  const defaultPresetId = useMemo(() => {
    const presets = configsResponse?.presets ?? [];
    const regimePreset = presets.find(p => p.strategy_id === "simple_regime");
    return regimePreset?.config_id ?? presets[0]?.config_id;
  }, [configsResponse]);

  const { data } = useDailySuggestion(
    userId,
    defaultPresetId ? { config_id: defaultPresetId } : {}
  );

  if (!data) return null;

  return (
    <>
      <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium border border-indigo-100 dark:border-indigo-900/50">
            <TrendingUp className="w-3 h-3" />
            BTC ($65k) &gt; 200 DMA ($58k)
          </div>
          <div>
            <h3 className="text-4xl font-light text-gray-900 dark:text-white">
              Portfolio Health
            </h3>
            <p className="text-gray-500 dark:text-gray-400 font-light mt-2">
              Aligned with{" "}
              <span className="text-gray-900 dark:text-white font-medium capitalize">
                {data.regime.current.replace("_", " ")}
              </span>{" "}
              Regime
            </p>
          </div>
        </div>

        <ActionCard
          title={`${data.trade_suggestions.length} Actions`}
          subtitle="Suggested Moves"
          icon={
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
        >
          {/* Allocation Impact Visualization */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <ImpactVisual
              trades={data.trade_suggestions}
              totalValue={data.total_value_usd}
            />
          </div>

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
        </ActionCard>
      </div>

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={() => setIsReviewOpen(false)}
        trades={data.trade_suggestions}
        totalValue={data.total_value_usd}
      />
    </>
  );
}

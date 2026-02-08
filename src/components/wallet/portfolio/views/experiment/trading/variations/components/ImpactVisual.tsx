"use client";

import { ArrowRight } from "lucide-react";
import type { TradeSuggestion } from "@/types/strategy";

// --- Helpers ---

export const usePortfolioState = (
  trades: TradeSuggestion[],
  totalValue: number
) => {
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

export function ImpactVisual({
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

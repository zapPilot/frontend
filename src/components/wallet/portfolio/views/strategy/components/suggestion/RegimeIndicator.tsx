"use client";

import { motion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { getRegimeConfig } from "@/constants/regimeDisplay";
import { cn } from "@/lib/ui/classNames";
import type { RegimeInfo } from "@/types/strategy";

interface RegimeIndicatorProps {
  regime: RegimeInfo;
}

const DirectionIcon = ({ direction }: { direction: string }) => {
  switch (direction) {
    case "improving":
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    case "worsening":
      return <TrendingDown className="w-4 h-4 text-rose-400" />;
    default:
      return <Minus className="w-4 h-4 text-gray-400" />;
  }
};

export function RegimeIndicator({ regime }: RegimeIndicatorProps) {
  const config = getRegimeConfig(regime.current);
  const sentimentValue = regime.sentiment_value ?? config.value;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            Market Regime
          </span>
          <div className="flex items-center gap-3 mt-2">
            <h3 className={cn("text-2xl font-bold", config.color)}>
              {config.label}
            </h3>
            <div
              className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                config.bg,
                config.color,
                config.border
              )}
            >
              {sentimentValue}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="capitalize text-gray-300">{regime.direction}</span>
            <DirectionIcon direction={regime.direction} />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            For {regime.duration_days} day
            {regime.duration_days !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Visual Meter */}
      <div className="relative h-4 bg-gray-900/50 rounded-full overflow-hidden w-full ring-1 ring-white/5 shadow-inner mt-auto">
        {/* Background Gradients */}
        <div className="absolute inset-0 flex opacity-30">
          <div className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500" />
          <div className="flex-1 bg-gradient-to-r from-rose-500 to-orange-500" />
          <div className="flex-1 bg-gradient-to-r from-orange-500 to-blue-500" />
          <div className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500" />
          <div className="flex-1 bg-gradient-to-r from-emerald-500 to-green-400" />
        </div>

        {/* Indicator Marker */}
        <motion.div
          className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_15px_rgba(255,255,255,1)] z-10 rounded-full"
          initial={{ left: "50%" }}
          animate={{ left: `${sentimentValue}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 font-medium uppercase tracking-wider px-1">
        <span>Fear</span>
        <span>Neutral</span>
        <span>Greed</span>
      </div>
    </div>
  );
}

"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/ui/classNames";
import type { RegimeInfo } from "@/types/strategy";

interface RegimeIndicatorProps {
  regime: RegimeInfo;
}

const REGIME_COLORS: Record<string, string> = {
  extreme_fear: "bg-red-500/20 text-red-400 border-red-500/30",
  fear: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  greed: "bg-green-500/20 text-green-400 border-green-500/30",
  extreme_greed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const REGIME_LABELS: Record<string, string> = {
  extreme_fear: "Extreme Fear",
  fear: "Fear",
  neutral: "Neutral",
  greed: "Greed",
  extreme_greed: "Extreme Greed",
};

const DirectionIcon = ({ direction }: { direction: string }) => {
  switch (direction) {
    case "improving":
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    case "worsening":
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    default:
      return <Minus className="w-4 h-4 text-gray-400" />;
  }
};

export function RegimeIndicator({ regime }: RegimeIndicatorProps) {
  const colorClass = REGIME_COLORS[regime.current] || REGIME_COLORS["neutral"];
  const label = REGIME_LABELS[regime.current] || "Unknown";

  return (
    <div className="flex items-center gap-4">
      {/* Main regime badge */}
      <div
        className={cn("px-4 py-2 rounded-lg border font-medium", colorClass)}
      >
        {label}
        {regime.sentiment_value !== null && (
          <span className="ml-2 opacity-75">({regime.sentiment_value})</span>
        )}
      </div>

      {/* Direction and duration */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <DirectionIcon direction={regime.direction} />
        <span className="capitalize">{regime.direction}</span>
        <span className="text-gray-600">|</span>
        <span>
          {regime.duration_days} day{regime.duration_days !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

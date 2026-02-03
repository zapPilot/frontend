"use client";

import { cn } from "@/lib/ui/classNames";
import type { StrategyBuckets } from "@/types/strategy";

interface AllocationComparisonProps {
  current: StrategyBuckets;
  target: StrategyBuckets;
  targetName: string | null;
}

const BUCKET_COLORS = {
  spot: {
    bg: "bg-blue-500",
    text: "text-blue-400",
    label: "Spot",
  },
  lp: {
    bg: "bg-purple-500",
    text: "text-purple-400",
    label: "LP",
  },
  stable: {
    bg: "bg-green-500",
    text: "text-green-400",
    label: "Stable",
  },
};

interface AllocationBarProps {
  allocation: StrategyBuckets;
  label: string;
}

function AllocationBar({ allocation, label }: AllocationBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <div className="flex gap-4 text-xs">
          <span className={BUCKET_COLORS.spot.text}>
            Spot: {(allocation.spot * 100).toFixed(0)}%
          </span>
          <span className={BUCKET_COLORS.lp.text}>
            LP: {(allocation.lp * 100).toFixed(0)}%
          </span>
          <span className={BUCKET_COLORS.stable.text}>
            Stable: {(allocation.stable * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex">
        <div
          className={cn(BUCKET_COLORS.spot.bg, "transition-all duration-500")}
          style={{ width: `${allocation.spot * 100}%` }}
        />
        <div
          className={cn(BUCKET_COLORS.lp.bg, "transition-all duration-500")}
          style={{ width: `${allocation.lp * 100}%` }}
        />
        <div
          className={cn(BUCKET_COLORS.stable.bg, "transition-all duration-500")}
          style={{ width: `${allocation.stable * 100}%` }}
        />
      </div>
    </div>
  );
}

export function AllocationComparison({
  current,
  target,
  targetName,
}: AllocationComparisonProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">
          Allocation Comparison
        </h3>
        {targetName && (
          <span className="text-sm text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
            Target: {targetName.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* Bars */}
      <div className="space-y-4">
        <AllocationBar allocation={current} label="Current" />
        <AllocationBar allocation={target} label="Target" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded", BUCKET_COLORS.spot.bg)} />
          <span>Spot (BTC, ETH, Alts)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded", BUCKET_COLORS.lp.bg)} />
          <span>LP (ETH-USDC, BTC-USDC)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded", BUCKET_COLORS.stable.bg)} />
          <span>Stable (USDC, USDT, etc.)</span>
        </div>
      </div>
    </div>
  );
}

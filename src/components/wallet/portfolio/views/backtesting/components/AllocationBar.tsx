import { useMemo } from "react";

import { getStrategyColor } from "../utils/strategyDisplay";

export interface PortfolioConstituents {
  spot: Record<string, number> | number;
  stable: number;
  lp: Record<string, number> | number;
}

export interface AllocationBarProps {
  displayName: string;
  constituents: PortfolioConstituents;
  strategyId?: string;
  index?: number | undefined;
}

const ASSET_COLORS: Record<string, string> = {
  btc: "bg-[#F7931A]", // Bitcoin Orange
  eth: "bg-[#627EEA]", // Ethereum Blue/Purple
  stable: "bg-gray-500",
  lp: "bg-cyan-500",
  other: "bg-blue-400",
};

interface AllocationSegment {
  key: string;
  label: string;
  percentage: number;
  color: string;
  isGroup?: boolean;
}

export function AllocationBar({
  displayName,
  constituents,
  strategyId,
  index,
}: AllocationBarProps) {
  const segments = useMemo(() => {
    const s: AllocationSegment[] = [];

    // Helper to process a bucket (spot or lp)
    const processBucket = (
      bucket: Record<string, number> | number,
      bucketKey: "spot" | "lp"
    ) => {
      if (typeof bucket === "number") {
        return [{ key: bucketKey, value: bucket, subKey: null }];
      }
      return Object.entries(bucket).map(([k, v]) => ({
        key: bucketKey,
        value: v,
        subKey: k,
      }));
    };

    const spotItems = processBucket(constituents.spot, "spot");
    const lpItems = processBucket(constituents.lp, "lp");
    const stableVal = constituents.stable;

    const total =
      spotItems.reduce((sum, item) => sum + item.value, 0) +
      lpItems.reduce((sum, item) => sum + item.value, 0) +
      stableVal;

    if (total === 0) return [];

    // Spot segments
    for (const item of spotItems) {
      if (item.value <= 0) continue;
      const pct = (item.value / total) * 100;
      let color = ASSET_COLORS["other"] || "bg-blue-400";
      let label = "Spot";

      if (item.subKey) {
        label = item.subKey.toUpperCase();
        const keyLower = item.subKey.toLowerCase();
        const specificColor = ASSET_COLORS[keyLower];
        if (specificColor) {
          color = specificColor;
        }
      } else {
        color = "bg-blue-500";
      }

      const key = `spot-${item.subKey || "gen"}`;
      s.push({ key, label, percentage: pct, color });
    }

    // Stable segment
    if (stableVal > 0) {
      s.push({
        key: "stable",
        label: "Stable",
        percentage: (stableVal / total) * 100,
        color: ASSET_COLORS["stable"] || "bg-gray-500",
      });
    }

    // LP segments
    for (const item of lpItems) {
      if (item.value <= 0) continue;
      const pct = (item.value / total) * 100;
      // Use generic LP color for now
      const color = ASSET_COLORS["lp"] || "bg-cyan-500";
      let label = "LP";

      if (item.subKey) {
        label = `LP ${item.subKey.toUpperCase()}`;
      }

      const key = `lp-${item.subKey || "gen"}`;
      s.push({ key, label, percentage: pct, color });
    }

    return s;
  }, [constituents]);

  const hasAny = segments.length > 0;
  if (!hasAny) return null;

  const color =
    strategyId != null ? getStrategyColor(strategyId, index) : undefined;

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5">
        {color != null && (
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        {displayName}
      </div>
      <div className="flex h-3 rounded overflow-hidden">
        {segments.map(segment => {
          return (
            <div
              key={segment.key}
              className={`${segment.color} flex items-center justify-center min-w-[2px]`}
              style={{ width: `${Math.max(segment.percentage, 0.5)}%` }}
              title={`${segment.label}: ${segment.percentage.toFixed(1)}%`}
            >
              {segment.percentage > 12 && (
                <span className="text-[8px] text-white font-medium whitespace-nowrap px-0.5">
                  {segment.label === "Stable" ? "USD" : segment.label}{" "}
                  {segment.percentage.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Legend / Detailed Text below */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[8px] text-gray-500">
        {segments.map(segment => (
          <div key={segment.key} className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${segment.color}`} />
            <span>
              {segment.label}: {segment.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import type { ReactElement } from "react";

import {
  type BacktestConstituentsSource,
  mapBacktestToUnified,
  UnifiedAllocationBar,
} from "@/components/wallet/portfolio/components/allocation";

import { getStrategyColor } from "../utils/strategyDisplay";

export interface BacktestAllocationBarProps {
  displayName: string;
  constituents: BacktestConstituentsSource;
  strategyId?: string;
  index?: number | undefined;
  spotBreakdown?: string | null;
}

/**
 * BacktestAllocationBar - Allocation bar for backtest tooltip.
 *
 * Uses the unified allocation bar with backtest-specific data mapping.
 * Shows a strategy color indicator and optional spot breakdown details.
 */
export function BacktestAllocationBar({
  displayName,
  constituents,
  strategyId,
  index,
  spotBreakdown,
}: BacktestAllocationBarProps): ReactElement | null {
  const segments = mapBacktestToUnified(constituents);

  // Don't render if no segments
  if (segments.length === 0) {
    return null;
  }

  const strategyColor =
    strategyId != null ? getStrategyColor(strategyId, index) : undefined;

  return (
    <div className="space-y-1">
      {/* Strategy label with optional color indicator */}
      <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5">
        {strategyColor != null && (
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: strategyColor }}
          />
        )}
        {displayName}
      </div>

      {/* Unified allocation bar - compact size for tooltip */}
      <UnifiedAllocationBar
        segments={segments}
        size="sm"
        showLegend
        showLabels
        labelThreshold={15}
        testIdPrefix={`backtest-${strategyId ?? "default"}`}
      />

      {/* Optional spot breakdown text */}
      {spotBreakdown && (
        <div className="text-[8px] text-gray-500 pl-4">
          Spot: {spotBreakdown}
        </div>
      )}
    </div>
  );
}

"use client";

import {
  mapStrategyToUnified,
  UnifiedAllocationBar,
} from "@/components/wallet/portfolio/components/allocation";
import type { StrategyBuckets } from "@/types/strategy";

interface AllocationComparisonProps {
  current: StrategyBuckets;
  target: StrategyBuckets;
  targetName: string | null;
}

/**
 * AllocationComparison - Displays current vs target allocation using unified categories.
 *
 * Uses the unified 4-category model (BTC, BTC-STABLE, STABLE, ALT) for consistent
 * visualization across the application.
 *
 * Note: Strategy buckets (spot/lp/stable) are mapped to unified categories:
 * - spot → BTC (simplified - assumes BTC-heavy spot allocation)
 * - lp → BTC-STABLE (strategy focuses on BTC-USDC LP)
 * - stable → STABLE
 */
export function AllocationComparison({
  current,
  target,
  targetName,
}: AllocationComparisonProps) {
  const currentSegments = mapStrategyToUnified(current);
  const targetSegments = mapStrategyToUnified(target);

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
        <UnifiedAllocationBar
          segments={currentSegments}
          size="md"
          title="Current"
          testIdPrefix="comparison-current"
        />
        <UnifiedAllocationBar
          segments={targetSegments}
          size="md"
          title="Target"
          testIdPrefix="comparison-target"
        />
      </div>

      {/* Category Explanation */}
      <div className="text-xs text-gray-500">
        <p>
          <span className="text-gray-400">Categories:</span> BTC (spot holdings)
          • BTC-STABLE (BTC-USDC LP) • STABLE (stablecoins) • ALT (ETH, alts,
          ETH-LP)
        </p>
      </div>
    </div>
  );
}

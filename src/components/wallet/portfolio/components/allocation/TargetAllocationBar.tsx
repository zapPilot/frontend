import { getBarStyle } from "@/constants/assets";

import { AllocationLegend } from "./AllocationLegend";

/**
 * Simplified asset interface for target allocations.
 * Distinct from AllocationConstituent as this represents a desired state (target)
 * rather than a current wallet state, and is purely visual (percentage based).
 */
export interface TargetAsset {
  symbol: string;
  percentage: number;
  color: string;
}

interface TargetAllocationBarProps {
  assets: TargetAsset[];
}

const STYLES = {
  container: "flex flex-col gap-1",
  bar: "h-2 w-full rounded-full flex overflow-hidden",
} as const;

/**
 * TargetAllocationBar - Renders target portfolio allocation as a horizontal bar with legend.
 * This is a lightweight, static visualization compared to the interactive AllocationBars.
 */
export function TargetAllocationBar({ assets }: TargetAllocationBarProps) {
  if (assets.length === 0) {
    return null;
  }

  return (
    <div className={STYLES.container} data-testid="target-allocation-bar">
      <div className={STYLES.bar}>
        {assets.map(asset => (
          <div
            key={asset.symbol}
            data-testid={`target-${asset.symbol.toLowerCase()}`}
            className="h-full"
            style={{
              width: `${asset.percentage}%`,
              ...getBarStyle(asset.color),
            }}
          />
        ))}
      </div>
      <AllocationLegend items={assets} />
    </div>
  );
}

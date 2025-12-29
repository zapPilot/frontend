import { getBarStyle } from "@/constants/assets";
import { AllocationLegend } from "./AllocationLegend";

/**
 * TargetAllocationBar - Modular target allocation visualization
 *
 * Renders a bar showing target portfolio allocation split.
 * Supports 3 display variants:
 * - 'tooltip': Shows percentage on hover tooltip (default)
 * - 'legend': Shows inline labels below the bar
 * - 'expand': Bar expands on hover to show labels
 */


interface TargetAsset {
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
  segment: "h-full cursor-pointer transition-opacity hover:opacity-80",
} as const;


/**
 * Variant 2: Legend mode - shows labels below the bar
 */
function LegendVariant({ assets }: { assets: TargetAsset[] }) {
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


/**
 * Renders a horizontal bar split into segments based on asset percentages.
 * Each asset's width is proportional to its percentage of the total portfolio.
 *
 * Variants:
 * - 'legend': Static labels displayed below the bar
 */
export function TargetAllocationBar({
  assets
}: TargetAllocationBarProps) {
  if (assets.length === 0) {
    return null;
  }

  return <LegendVariant assets={assets} />;
}

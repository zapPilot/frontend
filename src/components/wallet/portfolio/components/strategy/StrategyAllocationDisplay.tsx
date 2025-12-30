import { ProgressBar } from "../shared";

interface StrategyAllocationDisplayProps {
  targetAllocation: {
    spot: number;
    lp: number;
    stable: number;
  };
  hideAllocationTarget?: boolean | undefined;
}

const STYLES = {
  allocationContainer:
    "bg-gray-800/50 rounded-lg p-4 border border-gray-700 mt-4",
} as const;

/**
 * StrategyAllocationDisplay - Visualizes target portfolio allocation
 *
 * Displays progress bars for target allocation across:
 * - Spot holdings
 * - LP (Liquidity Provider) positions
 * - Stable coin holdings
 *
 * Or shows "Maintain position" message when strategy doesn't change allocation.
 */
export function StrategyAllocationDisplay({
  targetAllocation,
  hideAllocationTarget = false,
}: StrategyAllocationDisplayProps) {
  if (hideAllocationTarget) {
    return (
      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30 mt-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-blue-200 font-medium">
          Maintain current position
        </span>
      </div>
    );
  }

  return (
    <div className={STYLES.allocationContainer}>
      <ProgressBar
        label="Target Spot"
        percentage={targetAllocation.spot}
        color="purple-500"
        className="mb-4"
      />

      <ProgressBar
        label="Target LP"
        percentage={targetAllocation.lp}
        color="blue-500"
        className="mb-4"
      />

      <ProgressBar
        label="Target Stable"
        percentage={targetAllocation.stable}
        color="emerald-500"
      />
    </div>
  );
}

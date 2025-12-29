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
  progressBarTrack: "w-full bg-gray-700 h-2 rounded-full overflow-hidden",
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
      {/* Spot Bar */}
      <div className="flex justify-between items-center mb-2">
        <span>Target Spot</span>
        <span className="text-white font-bold">{targetAllocation.spot}%</span>
      </div>
      <div className={`${STYLES.progressBarTrack} mb-4`}>
        <div
          className="bg-purple-500 h-full"
          style={{
            width: `${targetAllocation.spot}%`,
          }}
        />
      </div>

      {/* LP Bar */}
      <div className="flex justify-between items-center mb-2">
        <span>Target LP</span>
        <span className="text-blue-400 font-bold">{targetAllocation.lp}%</span>
      </div>
      <div className={`${STYLES.progressBarTrack} mb-4`}>
        <div
          className="bg-blue-500 h-full"
          style={{
            width: `${targetAllocation.lp}%`,
          }}
        />
      </div>

      {/* Stable Bar */}
      <div className="flex justify-between items-center mb-2">
        <span>Target Stable</span>
        <span className="text-emerald-400 font-bold">
          {targetAllocation.stable}%
        </span>
      </div>
      <div className={STYLES.progressBarTrack}>
        <div
          className="bg-emerald-500 h-full"
          style={{
            width: `${targetAllocation.stable}%`,
          }}
        />
      </div>
    </div>
  );
}

import {
  getStrategyColor,
  getStrategyDisplayName,
} from "../utils/strategyDisplay";

export const SIGNAL_LEGEND = [
  { label: "Sentiment", color: "#a855f7" },
  { label: "Buy Spot", color: "#22c55e" },
  { label: "Sell Spot", color: "#ef4444" },
  { label: "Buy LP", color: "#3b82f6" },
  { label: "Sell LP", color: "#d946ef" },
] as const;

interface BacktestChartLegendProps {
  sortedStrategyIds: string[];
}

export function BacktestChartLegend({
  sortedStrategyIds,
}: BacktestChartLegendProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sortedStrategyIds.map((strategyId, index) => {
        const displayName = getStrategyDisplayName(strategyId);
        const color = getStrategyColor(strategyId, index);
        return (
          <div
            key={strategyId}
            className="flex items-center gap-1.5 text-[10px] text-gray-400"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {displayName}
          </div>
        );
      })}
      {SIGNAL_LEGEND.map(({ label, color }) => (
        <div
          key={label}
          className="flex items-center gap-1.5 text-[10px] text-gray-400"
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          {label}
        </div>
      ))}
    </div>
  );
}

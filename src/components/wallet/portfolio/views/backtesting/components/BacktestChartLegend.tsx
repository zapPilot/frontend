import { CHART_SIGNALS, type SignalKey } from "../utils/chartHelpers";
import {
  getStrategyColor,
  getStrategyDisplayName,
} from "../utils/strategyDisplay";

const LEGEND_SIGNAL_KEYS: SignalKey[] = [
  "buy_spot",
  "sell_spot",
  "buy_lp",
  "sell_lp",
];

/** Signal subset shown in the chart legend (excludes borrow/repay/liquidate). */
export const SIGNAL_LEGEND = [
  { label: "Sentiment", color: "#a855f7" },
  ...LEGEND_SIGNAL_KEYS.flatMap(key => {
    const s = CHART_SIGNALS.find(c => c.key === key);
    return s ? [{ label: s.name, color: s.color }] : [];
  }),
];

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

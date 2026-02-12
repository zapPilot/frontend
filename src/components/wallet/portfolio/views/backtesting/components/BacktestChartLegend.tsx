import { CHART_SIGNALS, type SignalKey } from "../utils/chartHelpers";
import {
  getStrategyColor,
  getStrategyDisplayName,
} from "../utils/strategyDisplay";

interface LegendItem {
  label: string;
  color: string;
}

const EVENT_LEGEND_KEYS: SignalKey[] = [
  "buy_spot",
  "sell_spot",
  "buy_lp",
  "sell_lp",
];

export const INDICATOR_LEGEND: LegendItem[] = [
  { label: "Sentiment", color: "#a855f7" },
  { label: "DMA 200", color: "#f59e0b" },
];

/** Event subset shown in the chart legend (excludes borrow/repay/liquidate). */
export const EVENT_LEGEND: LegendItem[] = [
  ...EVENT_LEGEND_KEYS.flatMap(key => {
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
  const strategyLegend = sortedStrategyIds.map((strategyId, index) => ({
    label: getStrategyDisplayName(strategyId),
    color: getStrategyColor(strategyId, index),
  }));

  return (
    <div className="flex flex-wrap items-start gap-4">
      <LegendGroup title="Strategy" items={strategyLegend} />
      <LegendGroup title="Indicators" items={INDICATOR_LEGEND} />
      <LegendGroup title="Events" items={EVENT_LEGEND} />
    </div>
  );
}

function LegendGroup({ title, items }: { title: string; items: LegendItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-w-[120px]">
      <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(({ label, color }) => (
          <div
            key={`${title}-${label}`}
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
    </div>
  );
}

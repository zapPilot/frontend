import type { ReactElement } from "react";

import {
  getStrategyColor,
  getStrategyDisplayName,
} from "../utils/strategyDisplay";
import {
  EVENT_LEGEND,
  INDICATOR_LEGEND,
  type LegendItem,
} from "./backtestChartLegendData";

interface BacktestChartLegendProps {
  sortedStrategyIds: string[];
}

interface LegendGroupProps {
  title: string;
  items: LegendItem[];
}

export function BacktestChartLegend({
  sortedStrategyIds,
}: BacktestChartLegendProps): ReactElement {
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

function LegendGroup({ title, items }: LegendGroupProps): ReactElement | null {
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

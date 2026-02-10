import type { BacktestMetricsProps } from "../BacktestMetrics";
import { resolveCompactMetrics } from "./metricsUtils";

interface SecondaryMetricRailProps
  extends Pick<BacktestMetricsProps, "summary" | "sortedStrategyIds"> {
  actualDays: number;
  daysDisplay: string;
}

export function SecondaryMetricRail({
  summary,
  sortedStrategyIds,
  actualDays,
  daysDisplay,
}: SecondaryMetricRailProps) {
  const resolved = resolveCompactMetrics(sortedStrategyIds, summary?.strategies);

  return (
    <div className="flex items-center gap-4 overflow-x-auto scrollbar-none text-xs font-mono">
      {resolved.map((m) => (
        <div key={m.label} className="flex items-center gap-1.5 flex-shrink-0">
          <span className={m.isLeverage ? "text-purple-400/70" : "text-gray-500"}>{m.label}</span>
          <span className="text-gray-200">{m.formatted}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-gray-500">Period</span>
        <span className="text-gray-200">{actualDays}d</span>
        <span className="text-gray-500 text-[10px]">{daysDisplay}</span>
      </div>
    </div>
  );
}

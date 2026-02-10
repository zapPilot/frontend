import type { BacktestMetricsProps } from "../BacktestMetrics";
import { resolveCompactMetrics,type ResolvedMetric } from "./metricsUtils";

interface MetricsTickerProps
  extends Pick<BacktestMetricsProps, "summary" | "sortedStrategyIds"> {
  actualDays: number;
  daysDisplay: string;
}

function TickerContent({
  resolved,
  actualDays,
  daysDisplay,
}: {
  resolved: ResolvedMetric[];
  actualDays: number;
  daysDisplay: string;
}) {
  return (
    <div className="flex items-center gap-6 font-mono text-sm whitespace-nowrap">
      {resolved.map((m) => (
        <span key={m.label} className="flex items-center gap-1.5">
          <span className={m.isLeverage ? "text-purple-400/70" : "text-gray-500"}>{m.label}:</span>
          <span className="text-gray-200">{m.formatted}</span>
          <span className="text-gray-700 mx-1">&bull;</span>
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="text-gray-500">Period:</span>
        <span className="text-gray-200">{actualDays}d</span>
        <span className="text-gray-600 text-xs ml-0.5">{daysDisplay}</span>
      </span>
    </div>
  );
}

export function MetricsTicker({
  summary,
  sortedStrategyIds,
  actualDays,
  daysDisplay,
}: MetricsTickerProps) {
  const resolved = resolveCompactMetrics(sortedStrategyIds, summary?.strategies);

  return (
    <div className="relative overflow-hidden border-t border-white/5 bg-gray-900/70 backdrop-blur py-2.5 px-4">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-gray-900/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-gray-900/90 to-transparent z-10 pointer-events-none" />

      {/* Marquee track */}
      <div className="flex animate-[marquee_30s_linear_infinite]">
        <TickerContent resolved={resolved} actualDays={actualDays} daysDisplay={daysDisplay} />
        {/* Duplicate for seamless loop */}
        <div className="ml-12">
          <TickerContent resolved={resolved} actualDays={actualDays} daysDisplay={daysDisplay} />
        </div>
      </div>
    </div>
  );
}

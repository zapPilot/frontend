import { getStrategyColor } from "../utils/strategyDisplay";

export interface AllocationBarProps {
  displayName: string;
  percentages: { spot: number; stable: number; lp: number };
  strategyId?: string;
  index?: number | undefined;
}

const BAR_SEGMENTS = [
  { key: "spot", color: "bg-blue-500", label: "Spot" },
  { key: "stable", color: "bg-gray-500", label: "Stable" },
  { key: "lp", color: "bg-cyan-500", label: "LP" },
] as const;

export function AllocationBar({
  displayName,
  percentages,
  strategyId,
  index,
}: AllocationBarProps) {
  const hasAny =
    percentages.spot > 0 || percentages.stable > 0 || percentages.lp > 0;
  if (!hasAny) return null;

  const color =
    strategyId != null ? getStrategyColor(strategyId, index) : undefined;

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5">
        {color != null && (
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        {displayName}
      </div>
      <div className="flex h-3 rounded overflow-hidden">
        {BAR_SEGMENTS.map(({ key, color: bgColor }) => {
          const pct = percentages[key];
          if (pct <= 0) return null;
          return (
            <div
              key={key}
              className={`${bgColor} flex items-center justify-center min-w-[2px]`}
              style={{ width: `${Math.max(pct, 0.5)}%` }}
            >
              {pct > 8 && (
                <span className="text-[8px] text-white font-medium whitespace-nowrap">
                  {pct.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 text-[8px] text-gray-500">
        {BAR_SEGMENTS.map(({ key, label }) => (
          <span key={key}>
            {label}: {percentages[key].toFixed(1)}%
          </span>
        ))}
      </div>
    </div>
  );
}

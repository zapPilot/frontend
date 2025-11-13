import React from "react";

import { formatCurrency } from "@/lib/formatters";

import type {
  ProtocolYieldBreakdown,
  ProtocolYieldWindow,
} from "../../services/analyticsService";
import { MetricsTooltipContainer } from "./ROITooltip";

interface ProtocolBreakdownTooltipProps {
  position: { top: number; left: number };
  breakdown: ProtocolYieldBreakdown[];
  windowLabel: string;
  outliersRemoved?: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const getValueColor = (value: number) =>
  value > 0
    ? "text-emerald-300"
    : value < 0
      ? "text-rose-300"
      : "text-gray-300";

const formatSignedCurrency = (value: number) => {
  const formatted = formatCurrency(value, { smartPrecision: true });
  if (value > 0 && !formatted.startsWith("+")) {
    return `+${formatted}`;
  }
  return formatted;
};

const formatWindowSummary = (window: ProtocolYieldWindow) => {
  const { data_points, positive_days, negative_days } = window;
  if (data_points === 0) {
    return "No in-range data after filtering";
  }

  const neutralDays = Math.max(data_points - positive_days - negative_days, 0);
  const parts = [];
  if (positive_days > 0) {
    parts.push(`${positive_days} up`);
  }
  if (negative_days > 0) {
    parts.push(`${negative_days} down`);
  }
  if (neutralDays > 0) {
    parts.push(`${neutralDays} flat`);
  }
  return parts.join(" · ");
};

export function ProtocolBreakdownTooltip({
  position,
  breakdown,
  windowLabel,
  outliersRemoved = 0,
  onMouseEnter,
  onMouseLeave,
}: ProtocolBreakdownTooltipProps) {
  const hasBreakdownData = breakdown.length > 0;

  return (
    <MetricsTooltipContainer
      position={position}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="w-80 max-w-xs md:max-w-sm"
    >
      <div className="font-semibold text-gray-200 mb-2 text-center">
        🧭 Protocol Yield Breakdown
      </div>
      <div className="text-gray-300 text-xs mb-3 text-center">
        Showing today’s moves vs {windowLabel} filtered window
      </div>

      <div className="flex flex-col space-y-2 mb-3 max-h-64 overflow-y-auto pr-1">
        {hasBreakdownData ? (
          breakdown.map((item, index) => {
            const window = item.window;
            const todayValue = item.today?.yield_usd ?? 0;
            return (
              <div
                key={`${item.protocol}-${item.chain ?? "unknown"}-${index}`}
                className="bg-gray-800/80 rounded p-2 border border-gray-700/40"
              >
                <div className="flex justify-between text-gray-200 text-sm">
                  <span className="font-medium truncate" title={item.protocol}>
                    {item.protocol}
                    {item.chain ? (
                      <span className="text-xs text-gray-500 ml-1">
                        · {item.chain}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`font-semibold ${getValueColor(todayValue)}`}
                  >
                    {formatSignedCurrency(todayValue)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{windowLabel} total</span>
                  <span className={getValueColor(window.total_yield_usd)}>
                    {formatSignedCurrency(window.total_yield_usd)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Daily avg</span>
                  <span
                    className={getValueColor(window.average_daily_yield_usd)}
                  >
                    {formatSignedCurrency(window.average_daily_yield_usd)}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {formatWindowSummary(window)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-400 text-sm py-4">
            No protocol data available for this period.
          </div>
        )}
      </div>

      <div className="text-gray-400 text-[11px] leading-relaxed border-t border-gray-700 pt-2">
        💡 <strong>Tip:</strong> Compare today’s spike with the {windowLabel}{" "}
        trend to highlight noisy protocols.{" "}
        {outliersRemoved > 0
          ? `${outliersRemoved} outlier${outliersRemoved === 1 ? "" : "s"} removed for stats consistency.`
          : "No outliers removed in this window."}
      </div>
    </MetricsTooltipContainer>
  );
}

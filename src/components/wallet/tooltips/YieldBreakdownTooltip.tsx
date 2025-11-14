/**
 * Yield breakdown tooltip with multi-window support
 * Shows selected window prominently with collapsible view of other windows
 */

import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

import type { ProtocolYieldBreakdown } from "@/services/analyticsService";

import { MetricsTooltipContainer } from "./MetricsTooltipContainer";
import type { MetricsTooltipProps } from "./types";
import {
  formatSignedCurrency,
  formatWindowSummary,
  formatYieldWindowLabel,
  getValueColor,
  type YieldWindowData,
} from "./utils";

interface YieldBreakdownTooltipProps extends MetricsTooltipProps {
  /** Selected window to display prominently */
  selectedWindow: {
    key: string;
    window: YieldWindowData;
    label: string;
  };
  /** All available windows for comparison */
  allWindows?: Record<string, YieldWindowData> | undefined;
  /** Per-protocol breakdown for the selected window */
  breakdown: ProtocolYieldBreakdown[];
  /** Number of outliers removed in selected window */
  outliersRemoved?: number;
}

/**
 * Render a single protocol breakdown item
 */
function ProtocolBreakdownItem({
  item,
  windowLabel,
}: {
  item: ProtocolYieldBreakdown;
  windowLabel: string;
}) {
  const window = item.window;
  const todayValue = item.today?.yield_usd ?? 0;

  return (
    <div className="bg-gray-800/80 rounded p-2 border border-gray-700/40">
      <div className="flex justify-between text-gray-200 text-sm">
        <span className="font-medium truncate" title={item.protocol}>
          {item.protocol}
          {item.chain ? (
            <span className="text-xs text-gray-500 ml-1">· {item.chain}</span>
          ) : null}
        </span>
        <span className={`font-semibold ${getValueColor(todayValue)}`}>
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
        <span className={getValueColor(window.average_daily_yield_usd)}>
          {formatSignedCurrency(window.average_daily_yield_usd)}
        </span>
      </div>
      <div className="text-[10px] text-gray-500 mt-1">
        {formatWindowSummary(window)}
      </div>
    </div>
  );
}

/**
 * Render window comparison item
 */
function WindowComparisonItem({
  windowKey,
  window,
  isSelected,
}: {
  windowKey: string;
  window: YieldWindowData;
  isSelected: boolean;
}) {
  const label = formatYieldWindowLabel(windowKey);

  return (
    <div
      className={`flex justify-between items-center p-2 rounded ${
        isSelected ? "bg-purple-900/20 border border-purple-500/30" : "bg-gray-800/50"
      }`}
    >
      <div className="flex flex-col">
        <span className="text-gray-200 text-sm font-medium">
          {label}
          {isSelected && (
            <span className="ml-2 text-[10px] text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded-full">
              Selected
            </span>
          )}
        </span>
        <span className="text-[10px] text-gray-500">
          {window.data_points} data points · {window.positive_days} up ·{" "}
          {window.negative_days} down
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span
          className={`text-sm font-semibold ${getValueColor(window.average_daily_yield_usd)}`}
        >
          {formatSignedCurrency(window.average_daily_yield_usd)}
        </span>
        <span className="text-[10px] text-gray-500">daily avg</span>
      </div>
    </div>
  );
}

/**
 * Yield breakdown tooltip with hybrid display
 *
 * Shows:
 * - Selected window prominently with badge
 * - Per-protocol breakdown for selected window
 * - Collapsible section showing all available windows
 */
export function YieldBreakdownTooltip({
  position,
  selectedWindow,
  allWindows,
  breakdown,
  outliersRemoved = 0,
  onMouseEnter,
  onMouseLeave,
}: YieldBreakdownTooltipProps) {
  const [isWindowsExpanded, setIsWindowsExpanded] = useState(false);
  const hasBreakdownData = breakdown.length > 0;
  const hasMultipleWindows = allWindows && Object.keys(allWindows).length > 1;

  // Get other windows (excluding selected)
  const otherWindows = hasMultipleWindows
    ? Object.entries(allWindows).filter(([key]) => key !== selectedWindow.key)
    : [];

  return (
    <MetricsTooltipContainer
      position={position}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="w-80 max-w-xs md:max-w-sm"
    >
      {/* Header */}
      <div className="font-semibold text-gray-200 mb-2 text-center">
        🧭 Protocol Yield Breakdown
      </div>

      {/* Selected Window Info */}
      <div className="flex items-center justify-center gap-2 text-xs mb-3">
        <span className="text-gray-300">Showing today&apos;s moves vs</span>
        <span className="text-purple-400 font-medium bg-purple-900/20 px-2 py-1 rounded-full">
          {selectedWindow.label}
        </span>
      </div>

      {/* Selected Window Stats */}
      <div className="bg-gray-800/60 rounded p-2 mb-3 border border-gray-700/40">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Data points</span>
          <span className="text-gray-200 font-medium">
            {selectedWindow.window.data_points}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Window summary</span>
          <span className="text-gray-200 font-medium text-right">
            {selectedWindow.window.positive_days} up ·{" "}
            {selectedWindow.window.negative_days} down
          </span>
        </div>
      </div>

      {/* Protocol Breakdown List */}
      <div className="flex flex-col space-y-2 mb-3 max-h-64 overflow-y-auto pr-1">
        {hasBreakdownData ? (
          breakdown.map((item, index) => (
            <ProtocolBreakdownItem
              key={`${item.protocol}-${item.chain ?? "unknown"}-${index}`}
              item={item}
              windowLabel={selectedWindow.label}
            />
          ))
        ) : (
          <div className="text-center text-gray-400 text-sm py-4">
            No protocol data available for this period.
          </div>
        )}
      </div>

      {/* Collapsible: Other Windows */}
      {hasMultipleWindows && otherWindows.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setIsWindowsExpanded(!isWindowsExpanded)}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-gray-300 bg-gray-800/40 rounded hover:bg-gray-800/60 transition-colors"
            type="button"
          >
            <span>View all windows ({otherWindows.length + 1} total)</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isWindowsExpanded ? "transform rotate-180" : ""}`}
            />
          </button>
          {isWindowsExpanded && (
            <div className="mt-2 space-y-1.5">
              {/* Show selected window first */}
              <WindowComparisonItem
                windowKey={selectedWindow.key}
                window={selectedWindow.window}
                isSelected={true}
              />
              {/* Then show other windows */}
              {otherWindows.map(([key, window]) => (
                <WindowComparisonItem
                  key={key}
                  windowKey={key}
                  window={window}
                  isSelected={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer with methodology */}
      <div className="text-gray-400 text-[11px] leading-relaxed border-t border-gray-700 pt-2">
        💡 <strong>Tip:</strong> Compare today&apos;s spike with the{" "}
        {selectedWindow.label} trend to highlight noisy protocols.{" "}
        {outliersRemoved > 0
          ? `${outliersRemoved} outlier${outliersRemoved === 1 ? "" : "s"} removed for stats consistency.`
          : "No outliers removed in this window."}
      </div>
    </MetricsTooltipContainer>
  );
}

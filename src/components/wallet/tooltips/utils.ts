/**
 * Shared utilities for metrics tooltips
 */

import { formatCurrency } from "@/lib/formatters";
import type {
  ProtocolYieldWindow,
  YieldWindowSummary,
} from "@/services/analyticsService";

/**
 * Get color class based on value (positive/negative/neutral)
 */
export const getValueColor = (value: number): string =>
  value > 0
    ? "text-emerald-300"
    : value < 0
      ? "text-rose-300"
      : "text-gray-300";

/**
 * Format currency with +/- sign prefix
 */
export const formatSignedCurrency = (value: number): string => {
  const formatted = formatCurrency(value, { smartPrecision: true });
  if (value > 0 && !formatted.startsWith("+")) {
    return `+${formatted}`;
  }
  return formatted;
};

/**
 * Format window summary showing positive/negative/neutral days
 */
export const formatWindowSummary = (window: ProtocolYieldWindow): string => {
  const { data_points, positive_days, negative_days } = window;
  if (data_points === 0) {
    return "No in-range data after filtering";
  }

  const neutralDays = Math.max(data_points - positive_days - negative_days, 0);
  const parts: string[] = [];
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

/**
 * Window selection for yield data
 * Selects the window with the most data points among positive average yields
 */
type YieldWindowData = YieldWindowSummary;

interface SelectedYieldWindow {
  key: string;
  window: YieldWindowData;
  label: string;
}

/**
 * Select the best yield window based on most data points among positive yields
 */
export const selectBestYieldWindow = (
  windows: Record<string, YieldWindowData>
): SelectedYieldWindow | null => {
  const entries = Object.entries(windows);

  if (entries.length === 0) {
    return null;
  }

  // Filter to windows with positive average daily yield
  const positiveWindows = entries.filter(
    ([, window]) => window.average_daily_yield_usd > 0
  );

  // If we have positive windows, select the one with most data points
  const selectedEntries =
    positiveWindows.length > 0 ? positiveWindows : entries;

  // Sort by data points (descending) and take the first - using slice to avoid mutation
  const sorted = selectedEntries
    .slice()
    .sort(
      ([, a], [, b]) => b.statistics.filtered_days - a.statistics.filtered_days
    );

  const firstEntry = sorted[0];
  if (!firstEntry) {
    return null;
  }

  const [key, window] = firstEntry;

  return {
    key,
    window,
    label: formatYieldWindowLabel(key),
  };
};

/**
 * Format yield window key to human-readable label
 * Similar to formatRoiWindowLabel but for yield windows
 */
export const formatYieldWindowLabel = (key: string): string => {
  // Handle formats like "7d", "30d", "90d"
  // Simple regex without backtracking issues
  const match = key.match(/^(\d+)d$/);
  if (match?.[1]) {
    const days = parseInt(match[1], 10);
    return days === 1 ? "1 day" : `${days} days`;
  }
  // Fallback to the key itself
  return key;
};

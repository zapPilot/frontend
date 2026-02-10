import type { BacktestStrategySummary } from "@/types/backtesting";

import { type StrategyMetric } from "../../ComparisonMetricCard";
import type { BacktestMetricsSummary } from "../BacktestMetrics";

export function buildMetrics(
  key: keyof BacktestStrategySummary,
  strategyIds: string[],
  strategies: BacktestMetricsSummary["strategies"] | undefined,
  format: (value: number) => string
): StrategyMetric[] {
  return strategyIds.map((strategyId): StrategyMetric => {
    const raw = strategies?.[strategyId]?.[key];
    const value = typeof raw === "number" ? raw : null;
    return {
      strategyId,
      value,
      formatted: value !== null ? format(value) : "N/A",
    };
  });
}

/**
 * Check if any strategy has borrowing metrics.
 */
export function hasBorrowingMetrics(
  strategies: BacktestMetricsSummary["strategies"] | undefined
): boolean {
  if (!strategies) return false;
  return Object.values(strategies).some(
    s =>
      s.total_borrow_events != null ||
      s.total_repay_events != null ||
      s.liquidation_events != null
  );
}

// ─── Shared compact metric configs for rail/ticker views ──────────────

export interface CompactMetricConfig {
  label: string;
  dataKey: keyof BacktestStrategySummary;
  format: (v: number) => string;
}

export const COMPACT_SECONDARY_METRICS: CompactMetricConfig[] = [
  { label: "Sharpe", dataKey: "sharpe_ratio", format: (v) => v.toFixed(2) },
  { label: "Sortino", dataKey: "sortino_ratio", format: (v) => v.toFixed(2) },
  { label: "Vol", dataKey: "volatility", format: (v) => `${(v * 100).toFixed(1)}%` },
  { label: "Beta", dataKey: "beta", format: (v) => v.toFixed(2) },
  { label: "Final", dataKey: "final_value", format: (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
];

export const COMPACT_LEVERAGE_METRICS: CompactMetricConfig[] = [
  { label: "Borrows", dataKey: "total_borrow_events", format: (v) => String(v) },
  { label: "Interest", dataKey: "total_interest_paid", format: (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
  { label: "Liquidations", dataKey: "liquidation_events", format: (v) => String(v) },
];

export interface ResolvedMetric {
  label: string;
  formatted: string;
  isLeverage: boolean;
}

export function resolveCompactMetrics(
  sortedStrategyIds: string[],
  strategies: BacktestMetricsSummary["strategies"] | undefined
): ResolvedMetric[] {
  const base = COMPACT_SECONDARY_METRICS.map((m) => {
    const metrics = buildMetrics(m.dataKey, sortedStrategyIds, strategies, m.format);
    return { label: m.label, formatted: metrics.find((met) => met.value !== null)?.formatted ?? "N/A", isLeverage: false };
  });
  if (!hasBorrowingMetrics(strategies)) return base;
  const leverage = COMPACT_LEVERAGE_METRICS.map((m) => {
    const metrics = buildMetrics(m.dataKey, sortedStrategyIds, strategies, m.format);
    return { label: m.label, formatted: metrics.find((met) => met.value !== null)?.formatted ?? "N/A", isLeverage: true };
  });
  return [...base, ...leverage];
}

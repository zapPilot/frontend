"use client";

import type { BacktestStrategySummary } from "@/types/backtesting";

import {
  ComparisonMetricCard,
  type StrategyMetric,
} from "../ComparisonMetricCard";
import { MetricCard } from "../MetricCard";
import {
  getStrategyColor,
  getStrategyDisplayName,
} from "../utils/strategyDisplay";

export interface BacktestMetricsSummary {
  strategies: Record<string, BacktestStrategySummary>;
}

export interface BacktestMetricsProps {
  summary: BacktestMetricsSummary | null;
  sortedStrategyIds: string[];
  actualDays: number;
  daysDisplay: string;
}

function buildMetrics(
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
function hasBorrowingMetrics(
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

export function BacktestMetrics({
  summary,
  sortedStrategyIds,
  actualDays,
  daysDisplay,
}: BacktestMetricsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComparisonMetricCard
          label="ROI"
          unit="%"
          highlightMode="highest"
          metrics={buildMetrics(
            "roi_percent",
            sortedStrategyIds,
            summary?.strategies,
            v => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
          )}
        />
        <ComparisonMetricCard
          label="Final Value"
          unit="$"
          highlightMode="highest"
          metrics={buildMetrics(
            "final_value",
            sortedStrategyIds,
            summary?.strategies,
            v => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          )}
        />
        <ComparisonMetricCard
          label="Max Drawdown"
          unit="%"
          highlightMode="lowest"
          metrics={buildMetrics(
            "max_drawdown_percent",
            sortedStrategyIds,
            summary?.strategies,
            v => `${v.toFixed(1)}%`
          )}
        />
        <MetricCard
          label="Simulation Period"
          value={`${actualDays} days`}
          subtext={daysDisplay}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <ComparisonMetricCard
          label="Sharpe Ratio"
          highlightMode="highest"
          metrics={buildMetrics(
            "sharpe_ratio",
            sortedStrategyIds,
            summary?.strategies,
            v => v.toFixed(2)
          )}
        />
        <ComparisonMetricCard
          label="Sortino Ratio"
          highlightMode="highest"
          metrics={buildMetrics(
            "sortino_ratio",
            sortedStrategyIds,
            summary?.strategies,
            v => v.toFixed(2)
          )}
        />
        <ComparisonMetricCard
          label="Calmar Ratio"
          highlightMode="highest"
          metrics={buildMetrics(
            "calmar_ratio",
            sortedStrategyIds,
            summary?.strategies,
            v => v.toFixed(2)
          )}
        />
        <ComparisonMetricCard
          label="Volatility"
          unit="%"
          highlightMode="lowest"
          metrics={buildMetrics(
            "volatility",
            sortedStrategyIds,
            summary?.strategies,
            v => `${(v * 100).toFixed(1)}%`
          )}
        />
        <ComparisonMetricCard
          label="Beta"
          highlightMode="lowest"
          metrics={buildMetrics(
            "beta",
            sortedStrategyIds,
            summary?.strategies,
            v => v.toFixed(2)
          )}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {sortedStrategyIds.map((strategyId, index) => {
          const strategySummary = summary?.strategies[strategyId];
          if (!strategySummary) return null;

          const displayName = getStrategyDisplayName(strategyId);
          const trades = strategySummary.trade_count ?? 0;
          const color = getStrategyColor(strategyId, index);

          return (
            <div
              key={strategyId}
              className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 flex items-center gap-2"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0">
                <div className="text-xs text-gray-400 truncate">
                  {displayName}
                </div>
                <div className="text-sm font-medium text-white">
                  {trades} trades
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leverage & Risk Section - show when any strategy has borrowing metrics */}
      {hasBorrowingMetrics(summary?.strategies) && (
        <div className="border-t border-gray-800/50 pt-4 mt-4">
          <h4 className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Leverage Metrics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ComparisonMetricCard
              label="Borrow Events"
              highlightMode="highest"
              metrics={buildMetrics(
                "total_borrow_events",
                sortedStrategyIds,
                summary?.strategies,
                v => String(v)
              )}
            />
            <ComparisonMetricCard
              label="Interest Paid"
              unit="$"
              highlightMode="lowest"
              metrics={buildMetrics(
                "total_interest_paid",
                sortedStrategyIds,
                summary?.strategies,
                v =>
                  `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              )}
            />
            <ComparisonMetricCard
              label="Liquidations"
              highlightMode="lowest"
              metrics={buildMetrics(
                "liquidation_events",
                sortedStrategyIds,
                summary?.strategies,
                v => String(v)
              )}
            />
            <ComparisonMetricCard
              label="Time Leveraged"
              unit="%"
              highlightMode="highest"
              metrics={buildMetrics(
                "time_in_leverage_pct",
                sortedStrategyIds,
                summary?.strategies,
                v => `${v.toFixed(1)}%`
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}

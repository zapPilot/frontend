"use client";

import { Activity, ChevronDown, ChevronUp, Play, RefreshCw, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BaseCard } from "@/components/ui/BaseCard";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import type { BacktestRequest } from "@/types/backtesting";
import { formatCurrency } from "@/utils";

import { ComparisonMetricCard, StrategyMetric } from "./backtesting/ComparisonMetricCard";
import { MetricCard } from "./backtesting/MetricCard";

const DEFAULT_REQUEST: BacktestRequest = {
  token_symbol: "BTC",
  total_capital: 10000, // Split 50% BTC, 50% stables
  days: 500,
  rebalance_step_count: 20,
  rebalance_interval_days: 2,
  drift_threshold: 0.25
  // No start_date/end_date = backend defaults to last 90 days
};

const VALID_REGIMES = [
  "extreme_fear",
  "fear",
  "neutral",
  "greed",
  "extreme_greed",
] as const;

/**
 * Available additional strategies from the backtesting registry.
 * These are beyond the default dca_classic and smart_dca strategies.
 */
const AVAILABLE_STRATEGIES = [
  "momentum",
  "mean_reversion",
  "trend_following",
  "sentiment_dca",
] as const;

/**
 * Display names for strategy IDs.
 * Used for human-readable labels in the UI.
 */
const STRATEGY_DISPLAY_NAMES: Record<string, string> = {
  dca_classic: "Normal DCA",
  smart_dca: "Regime Strategy",
  momentum: "Momentum",
  mean_reversion: "Mean Reversion",
  trend_following: "Trend Following",
  sentiment_dca: "Sentiment DCA",
};

/**
 * Colors for each strategy line in the chart.
 */
const STRATEGY_COLORS: Record<string, string> = {
  dca_classic: "#4b5563",  // gray-600
  smart_dca: "#3b82f6",    // blue-500
  momentum: "#10b981",     // emerald-500
  mean_reversion: "#f59e0b", // amber-500
  trend_following: "#8b5cf6", // violet-500
  sentiment_dca: "#ec4899",  // pink-500
};

/**
 * Calculate percentage ratios from constituent absolute values.
 * Returns percentages for spot, stable, and lp components.
 */
export const calculatePercentages = (constituents: {
  spot: number;
  stable: number;
  lp: number;
}): { spot: number; stable: number; lp: number } => {
  const total = constituents.spot + constituents.stable + constituents.lp;
  if (total === 0) return { spot: 0, stable: 0, lp: 0 };
  return {
    spot: (constituents.spot / total) * 100,
    stable: (constituents.stable / total) * 100,
    lp: (constituents.lp / total) * 100,
  };
};

/**
 * Custom Tooltip component that renders date label only once
 * and properly formats all chart data entries.
 * Shows which strategies triggered trading signals.
 */
export const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string | number;
}) => {

  if (!active || !payload || payload.length === 0) return null;

  const dateStr = new Date(String(label)).toLocaleDateString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstPayload = payload[0]?.payload as any;
  const sentiment = firstPayload?.sentiment_label;

  const sentimentStr = sentiment
    ? ` (${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)})`
    : "";

  // Extract token price with fallback handling
  const tokenPrice = firstPayload?.token_price?.btc ?? firstPayload?.price;

  // Extract event strategies mapping (which strategies triggered each event)
  const eventStrategies = firstPayload?.eventStrategies as Record<string, string[]> | undefined;

  // Extract portfolio constituent data from both strategies
  const smartDca = firstPayload?.strategies?.smart_dca;
  const dcaClassic = firstPayload?.strategies?.dca_classic;
  const smartConstituents = smartDca?.portfolio_constituant;
  const classicConstituents = dcaClassic?.portfolio_constituant;

  // Calculate percentages if constituents exist
  const smartPercentages = smartConstituents
    ? calculatePercentages(smartConstituents)
    : null;
  const classicPercentages = classicConstituents
    ? calculatePercentages(classicConstituents)
    : null;

  // Map signal names to event keys
  const signalToEventKey: Record<string, string> = {
    "Buy Spot": "buy_spot",
    "Sell Spot": "sell_spot",
    "Buy LP": "buy_lp",
    "Sell LP": "sell_lp",
  };

  return (
    <div
      className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg"
      style={{
        backgroundColor: "#111827",
        borderColor: "#374151",
        borderRadius: "0.5rem",
      }}
    >
      <div className="text-xs font-medium text-white mb-2">
        {dateStr}
        {sentimentStr}
      </div>
      {tokenPrice != null && (
        <div className="text-xs text-gray-400 mb-2">
          BTC Price: {formatCurrency(tokenPrice, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          if (!entry) return null;

          const name = entry.name || "";
          const value = entry.value;

          // Handle signal entries (Buy Spot, Sell Spot, Buy LP, Sell LP)
          if (signalToEventKey[name]) {
            if (value) {
              // Get strategies that triggered this event
              const eventKey = signalToEventKey[name];
              const strategies = eventStrategies?.[eventKey] || [];
              const strategiesStr = strategies.length > 0
                ? ` (${strategies.join(", ")})`
                : "";

              return (
                <div
                  key={index}
                  className="text-xs"
                  style={{ color: entry.color || "#fff" }}
                >
                  {name}{strategiesStr}
                </div>
              );
            }
            return null;
          }

          // Handle value entries (Regime Strategy, Normal DCA, etc.)
          if (typeof value === "number") {
            return (
              <div
                key={index}
                className="text-xs"
                style={{ color: entry.color || "#fff" }}
              >
                {name}: ${value.toLocaleString()}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Portfolio Constituent Ratios */}
      {(smartPercentages || classicPercentages) && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
          {/* Stacked Bar Component */}
          {classicPercentages && (
            <div className="space-y-1">
              <div className="text-[10px] text-gray-400 font-medium">
                Normal DCA
              </div>
              <div className="flex h-3 rounded overflow-hidden relative">
                {classicPercentages.spot > 0 && (
                  <div
                    className="bg-blue-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(classicPercentages.spot, 0.5)}%`,
                    }}
                  >
                    {classicPercentages.spot > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {classicPercentages.spot.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
                {classicPercentages.stable > 0 && (
                  <div
                    className="bg-gray-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(classicPercentages.stable, 0.5)}%`,
                    }}
                  >
                    {classicPercentages.stable > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {classicPercentages.stable.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
                {classicPercentages.lp > 0 && (
                  <div
                    className="bg-cyan-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(classicPercentages.lp, 0.5)}%`,
                    }}
                  >
                    {classicPercentages.lp > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {classicPercentages.lp.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 text-[8px] text-gray-500">
                <span>
                  Spot: {classicPercentages.spot.toFixed(1)}%
                </span>
                <span>
                  Stable: {classicPercentages.stable.toFixed(1)}%
                </span>
                <span>LP: {classicPercentages.lp.toFixed(1)}%</span>
              </div>
            </div>
          )}

          {smartPercentages && (
            <div className="space-y-1">
              <div className="text-[10px] text-gray-400 font-medium">
                Regime Strategy
              </div>
              <div className="flex h-3 rounded overflow-hidden relative">
                {smartPercentages.spot > 0 && (
                  <div
                    className="bg-blue-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(smartPercentages.spot, 0.5)}%`,
                    }}
                  >
                    {smartPercentages.spot > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {smartPercentages.spot.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
                {smartPercentages.stable > 0 && (
                  <div
                    className="bg-gray-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(smartPercentages.stable, 0.5)}%`,
                    }}
                  >
                    {smartPercentages.stable > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {smartPercentages.stable.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
                {smartPercentages.lp > 0 && (
                  <div
                    className="bg-cyan-500 flex items-center justify-center min-w-[2px]"
                    style={{
                      width: `${Math.max(smartPercentages.lp, 0.5)}%`,
                    }}
                  >
                    {smartPercentages.lp > 8 && (
                      <span className="text-[8px] text-white font-medium whitespace-nowrap">
                        {smartPercentages.lp.toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 text-[8px] text-gray-500">
                <span>
                  Spot: {smartPercentages.spot.toFixed(1)}%
                </span>
                <span>
                  Stable: {smartPercentages.stable.toFixed(1)}%
                </span>
                <span>LP: {smartPercentages.lp.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const BacktestingView = () => {
  const [params, setParams] = useState<BacktestRequest>(DEFAULT_REQUEST);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    mutate,
    data: backtestData,
    isPending,
    error,
  } = useBacktestMutation();

  // Get all strategy IDs from the response
  const strategyIds = useMemo(() => {
    if (!backtestData) return ["dca_classic", "smart_dca"];
    return Object.keys(backtestData.strategies);
  }, [backtestData]);

  const chartData = useMemo(() => {
    if (!backtestData) return [];
    return backtestData.timeline.map(point => {
      // Build dynamic data object with all strategy values
      const data: Record<string, unknown> = {
        ...point,
      };

      // Add portfolio value for each strategy
      for (const strategyId of strategyIds) {
        const strategy = point.strategies[strategyId];
        if (strategy) {
          data[`${strategyId}_value`] = strategy.portfolio_value;
        }
      }

      // Extract events from ALL strategies except dca_classic
      // Aggregate signals by event type for chart markers
      let buySpotSignal: number | null = null;
      let sellSpotSignal: number | null = null;
      let buyLpSignal: number | null = null;
      let sellLpSignal: number | null = null;

      // Track which strategies triggered events for tooltip
      const eventStrategies: Record<string, string[]> = {
        buy_spot: [],
        sell_spot: [],
        buy_lp: [],
        sell_lp: [],
      };

      for (const strategyId of strategyIds) {
        if (strategyId === "dca_classic") continue; // Skip baseline strategy (no trading signals)

        const strategy = point.strategies[strategyId];
        if (strategy?.event) {
          const displayName = STRATEGY_DISPLAY_NAMES[strategyId] || strategyId.replace(/_/g, " ");

          switch (strategy.event) {
            case "buy_spot":
              buySpotSignal = strategy.portfolio_value;
              eventStrategies["buy_spot"]?.push(displayName);
              break;
            case "sell_spot":
              sellSpotSignal = strategy.portfolio_value;
              eventStrategies["sell_spot"]?.push(displayName);
              break;
            case "buy_lp":
              buyLpSignal = strategy.portfolio_value;
              eventStrategies["buy_lp"]?.push(displayName);
              break;
            case "sell_lp":
              sellLpSignal = strategy.portfolio_value;
              eventStrategies["sell_lp"]?.push(displayName);
              break;
          }
        }
      }

      // Signal markers for chart (aggregated across strategies)
      data["buySpotSignal"] = buySpotSignal;
      data["sellSpotSignal"] = sellSpotSignal;
      data["buyLpSignal"] = buyLpSignal;
      data["sellLpSignal"] = sellLpSignal;

      // Store which strategies triggered each event (for tooltip display)
      data["eventStrategies"] = eventStrategies;

      return data;
    });
  }, [backtestData, strategyIds]);

  const yAxisDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 1000];

    const allValues: number[] = [];
    for (const point of chartData) {
      // Collect values from all strategies dynamically
      for (const strategyId of strategyIds) {
        const value = point[`${strategyId}_value`];
        if (typeof value === "number" && value != null) {
          allValues.push(value);
        }
      }
      // Also include signal values for proper domain calculation
      const buySpot = point["buySpotSignal"] as number | null;
      const sellSpot = point["sellSpotSignal"] as number | null;
      const buyLp = point["buyLpSignal"] as number | null;
      const sellLp = point["sellLpSignal"] as number | null;
      if (buySpot != null) allValues.push(buySpot);
      if (sellSpot != null) allValues.push(sellSpot);
      if (buyLp != null) allValues.push(buyLp);
      if (sellLp != null) allValues.push(sellLp);
    }

    if (allValues.length === 0) return [0, 1000];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;

    // Add 5% padding on each side
    const padding = range * 0.05;
    const lowerBound = Math.max(0, min - padding);
    const upperBound = max + padding;

    return [lowerBound, upperBound];
  }, [chartData, strategyIds]);

  const summary = useMemo(() => {
    if (!backtestData) return null;
    return {
      strategies: backtestData.strategies,
    };
  }, [backtestData]);

  /**
   * Calculate actual simulation period from the date range in timeline.
   * The timeline array is sampled (max ~90 points), but the dates represent
   * the actual simulation period which may span many more days.
   */
  const actualDays = useMemo(() => {
    if (!backtestData || backtestData.timeline.length < 2) return 0;
    const firstPoint = backtestData.timeline[0];
    const lastPoint = backtestData.timeline[backtestData.timeline.length - 1];
    if (!firstPoint || !lastPoint) return 0;
    const firstDate = new Date(firstPoint.date);
    const lastDate = new Date(lastPoint.date);
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both endpoints
  }, [backtestData]);

  // All strategies sorted: dca_classic first, smart_dca second, then others alphabetically
  const sortedStrategyIds = useMemo(() => {
    const coreStrategies = ["dca_classic", "smart_dca"];
    const additionalStrategies = strategyIds
      .filter(id => !coreStrategies.includes(id))
      .sort((a, b) => a.localeCompare(b));
    return [...coreStrategies.filter(id => strategyIds.includes(id)), ...additionalStrategies];
  }, [strategyIds]);

  // Format days display: show requested with availability note when different
  const daysDisplay = useMemo(() => {
    if (params.days) {
      if (params.days !== actualDays && actualDays > 0) {
        return `${params.days} days requested (${actualDays} available)`;
      }
      return `${actualDays} days simulated`;
    }
    return `${actualDays} days simulated`;
  }, [params.days, actualDays]);

  const handleRunBacktest = () => {
    mutate(params);
  };

  const handleResetParams = () => {
    setParams(DEFAULT_REQUEST);
  };

  const updateParam = <K extends keyof BacktestRequest>(
    key: K,
    value: BacktestRequest[K]
  ) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const toggleRegime = (regime: string) => {
    const current = params.action_regimes || [];
    const updated = current.includes(regime)
      ? current.filter(r => r !== regime)
      : [...current, regime];
    updateParam("action_regimes", updated.length > 0 ? updated : undefined);
  };

  const toggleStrategy = (strategy: string) => {
    const current = params.additional_strategies || [];
    const updated = current.includes(strategy)
      ? current.filter(s => s !== strategy)
      : [...current, strategy];
    updateParam("additional_strategies", updated.length > 0 ? updated : undefined);
  };

  useEffect(() => {
    handleRunBacktest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            DCA Strategy Comparison
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Compare Normal DCA vs Regime-Based Strategy performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRunBacktest}
            disabled={isPending}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                Run Backtest
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <BaseCard
          variant="glass"
          className="p-4 bg-red-500/5 border-red-500/20"
        >
          <div className="text-sm text-red-400">
            {error instanceof Error ? error.message : "Failed to run backtest"}
          </div>
        </BaseCard>
      )}

      {/* Parameter Controls */}
      <BaseCard variant="glass" className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">
              Backtest Parameters
            </h3>
            <button
              onClick={handleResetParams}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Token Symbol */}
            <div className="space-y-1">
              <label
                htmlFor="token_symbol"
                className="text-xs font-medium text-gray-400"
              >
                Token Symbol
              </label>
              <select
                id="token_symbol"
                value={params.token_symbol}
                onChange={e => updateParam("token_symbol", e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
              </select>
            </div>

            {/* Total Capital */}
            <div className="space-y-1">
              <label
                htmlFor="total_capital"
                className="text-xs font-medium text-gray-400"
              >
                Total Capital ($)
              </label>
              <input
                id="total_capital"
                type="number"
                min="1"
                step="100"
                value={params.total_capital}
                onChange={e =>
                  updateParam("total_capital", parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Days */}
            <div className="space-y-1">
              <label htmlFor="days" className="text-xs font-medium text-gray-400">
                Days (optional)
              </label>
              <input
                id="days"
                type="number"
                min="1"
                max="1000"
                value={params.days || ""}
                onChange={e =>
                  updateParam(
                    "days",
                    e.target.value ? parseInt(e.target.value, 10) : undefined
                  )
                }
                placeholder="Leave empty for date range"
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label
                htmlFor="start_date"
                className="text-xs font-medium text-gray-400"
              >
                Start Date (optional)
              </label>
              <input
                id="start_date"
                type="date"
                value={params.start_date || ""}
                onChange={e =>
                  updateParam(
                    "start_date",
                    e.target.value || undefined
                  )
                }
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label
                htmlFor="end_date"
                className="text-xs font-medium text-gray-400"
              >
                End Date (optional)
              </label>
              <input
                id="end_date"
                type="date"
                value={params.end_date || ""}
                onChange={e =>
                  updateParam(
                    "end_date",
                    e.target.value || undefined
                  )
                }
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Rebalance Step Count */}
            <div className="space-y-1">
              <label
                htmlFor="rebalance_step_count"
                className="text-xs font-medium text-gray-400"
              >
                Rebalance Step Count
              </label>
              <input
                id="rebalance_step_count"
                type="number"
                min="1"
                max="50"
                value={params.rebalance_step_count || ""}
                onChange={e =>
                  updateParam(
                    "rebalance_step_count",
                    e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined
                  )
                }
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Rebalance Interval Days */}
            <div className="space-y-1">
              <label
                htmlFor="rebalance_interval_days"
                className="text-xs font-medium text-gray-400"
              >
                Rebalance Interval (days)
              </label>
              <input
                id="rebalance_interval_days"
                type="number"
                min="0"
                max="30"
                value={params.rebalance_interval_days ?? ""}
                onChange={e => {
                  const value = e.target.value;
                  updateParam(
                    "rebalance_interval_days",
                    value === "" ? undefined : parseInt(value, 10)
                  );
                }}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Drift Threshold */}
            <div className="space-y-1">
              <label
                htmlFor="drift_threshold"
                className="text-xs font-medium text-gray-400"
              >
                Drift Threshold
              </label>
              <input
                id="drift_threshold"
                type="number"
                min="0.01"
                max="1"
                step="0.01"
                value={params.drift_threshold ?? ""}
                onChange={e => {
                  const value = e.target.value;
                  updateParam(
                    "drift_threshold",
                    value === "" ? undefined : Number(value)
                  );
                }}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-[10px] text-gray-500">
                Minimum portfolio drift required to trigger a rebalance. Example: 0.05 = 5%.
              </p>
            </div>
          </div>

          {/* Advanced Parameters */}
          <div className="border-t border-gray-800 pt-4">
            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
              >
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Advanced Parameters
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  {/* Action Regimes */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400">
                      Action Regimes (trigger capital deployment)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {VALID_REGIMES.map(regime => {
                        const isSelected =
                          params.action_regimes?.includes(regime) ?? false;
                        return (
                          <button
                            key={regime}
                            type="button"
                            onClick={() => toggleRegime(regime)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-gray-900/50 text-gray-400 hover:bg-gray-800 hover:text-white"
                            }`}
                          >
                            {regime.replace("_", " ")}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500">
                      Leave empty to use backend defaults: extreme_fear, fear,
                      greed, extreme_greed (neutral excluded)
                    </p>
                  </div>

                  {/* Additional Strategies */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400">
                      Additional Strategies
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_STRATEGIES.map(strategy => {
                        const isSelected =
                          params.additional_strategies?.includes(strategy) ?? false;
                        return (
                          <button
                            key={strategy}
                            type="button"
                            onClick={() => toggleStrategy(strategy)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isSelected
                                ? "bg-purple-600 text-white"
                                : "bg-gray-900/50 text-gray-400 hover:bg-gray-800 hover:text-white"
                            }`}
                          >
                            {STRATEGY_DISPLAY_NAMES[strategy] || strategy.replace("_", " ")}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500">
                      Select additional strategies to compare against the core DCA strategies
                    </p>
                  </div>

                  {/* Use Equal Capital Pool */}
                  <div className="flex items-center gap-3">
                    <input
                      id="use_equal_capital_pool"
                      type="checkbox"
                      checked={params.use_equal_capital_pool ?? true}
                      onChange={e =>
                        updateParam("use_equal_capital_pool", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="use_equal_capital_pool"
                      className="text-xs font-medium text-gray-400"
                    >
                      Use Equal Capital Pool (both strategies start with same
                      capital split 50% BTC, 50% stables)
                    </label>
                  </div>
                </div>
              )}
          </div>
        </div>
      </BaseCard>

      {/* Results Area */}
      {!backtestData ? (
        <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl p-8 text-center text-gray-500">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
            <Zap className="relative w-16 h-16 text-gray-700 mb-6" />
          </div>
          <h3 className="text-xl font-medium text-gray-200 mb-2">
            Ready to Compare Strategies
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Click &quot;Run Backtest&quot; to see how the Zap Pilot regime-based
            strategy compares to normal DCA over the last 90 days.
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          {/* Comparison Metric Cards - Multi-strategy performance comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ROI Comparison */}
            <ComparisonMetricCard
              label="ROI"
              unit="%"
              highlightMode="highest"
              metrics={sortedStrategyIds.map((strategyId): StrategyMetric => {
                const strategySummary = summary?.strategies[strategyId];
                const roi = strategySummary?.roi_percent ?? null;
                return {
                  strategyId,
                  value: roi,
                  formatted: roi !== null
                    ? `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`
                    : "N/A",
                };
              })}
            />

            {/* Final Value Comparison */}
            <ComparisonMetricCard
              label="Final Value"
              unit="$"
              highlightMode="highest"
              metrics={sortedStrategyIds.map((strategyId): StrategyMetric => {
                const strategySummary = summary?.strategies[strategyId];
                const finalValue = strategySummary?.final_value ?? null;
                return {
                  strategyId,
                  value: finalValue,
                  formatted: finalValue !== null
                    ? `$${finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : "N/A",
                };
              })}
            />

            {/* Max Drawdown Comparison */}
            <ComparisonMetricCard
              label="Max Drawdown"
              unit="%"
              highlightMode="lowest"
              metrics={sortedStrategyIds.map((strategyId): StrategyMetric => {
                const strategySummary = summary?.strategies[strategyId];
                const maxDrawdown = strategySummary?.max_drawdown_percent ?? null;
                return {
                  strategyId,
                  value: maxDrawdown,
                  formatted: maxDrawdown !== null
                    ? `${maxDrawdown.toFixed(1)}%`
                    : "N/A",
                };
              })}
            />

            {/* Simulation Period - Keep as simple MetricCard */}
            <MetricCard
              label="Simulation Period"
              value={`${actualDays} days`}
              subtext={daysDisplay}
            />
          </div>

          {/* Row 2: Risk-Adjusted Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Sharpe Ratio */}
            <ComparisonMetricCard
              label="Sharpe Ratio"
              highlightMode="highest"
              metrics={sortedStrategyIds.map((strategyId): StrategyMetric => {
                const strategySummary = summary?.strategies[strategyId];
                const value = strategySummary?.sharpe_ratio ?? null;
                return {
                  strategyId,
                  value,
                  formatted: value !== null ? value.toFixed(2) : "N/A",
                };
              })}
            />

            {/* Sortino Ratio */}
            <ComparisonMetricCard
              label="Sortino Ratio"
              highlightMode="highest"
              metrics={sortedStrategyIds.map((strategyId): StrategyMetric => {
                const strategySummary = summary?.strategies[strategyId];
                const value = strategySummary?.sortino_ratio ?? null;
                return {
                  strategyId,
                  value,
                  formatted: value !== null ? value.toFixed(2) : "N/A",
                };
              })}
            />

            {/* Calmar Ratio */}
            <ComparisonMetricCard
              label="Calmar Ratio"
              highlightMode="highest"
              metrics={sortedStrategyIds.map((strategyId): StrategyMetric => {
                const strategySummary = summary?.strategies[strategyId];
                const value = strategySummary?.calmar_ratio ?? null;
                return {
                  strategyId,
                  value,
                  formatted: value !== null ? value.toFixed(2) : "N/A",
                };
              })}
            />

            {/* Volatility */}
            <ComparisonMetricCard
              label="Volatility"
              unit="%"
              highlightMode="lowest"
              metrics={sortedStrategyIds.map((strategyId): StrategyMetric => {
                const strategySummary = summary?.strategies[strategyId];
                const value = strategySummary?.volatility ?? null;
                return {
                  strategyId,
                  value,
                  formatted: value !== null ? `${(value * 100).toFixed(1)}%` : "N/A",
                };
              })}
            />

            {/* Beta */}
            <ComparisonMetricCard
              label="Beta"
              highlightMode="lowest"
              metrics={sortedStrategyIds.map((strategyId): StrategyMetric => {
                const strategySummary = summary?.strategies[strategyId];
                const value = strategySummary?.beta ?? null;
                return {
                  strategyId,
                  value,
                  formatted: value !== null ? value.toFixed(2) : "N/A",
                };
              })}
            />
          </div>

          {/* Trade Count Summary - Secondary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {sortedStrategyIds.map((strategyId) => {
              const strategySummary = summary?.strategies[strategyId];
              if (!strategySummary) return null;

              const displayName = STRATEGY_DISPLAY_NAMES[strategyId] || strategyId.replace(/_/g, " ");
              const trades = strategySummary.trade_count ?? 0;
              const color = STRATEGY_COLORS[strategyId] || "#6b7280";

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
                    <div className="text-xs text-gray-400 truncate">{displayName}</div>
                    <div className="text-sm font-medium text-white">{trades} trades</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <BaseCard
            variant="glass"
            className="p-1 h-[500px] relative overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-800/50 bg-gray-900/30 flex justify-between items-center">
              <div className="text-sm font-medium text-white flex items-center gap-2">
                Portfolio Value Growth
                <span className="text-xs font-normal text-gray-500">
                  ({actualDays} Days)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Dynamic strategy legends */}
                {sortedStrategyIds.map(strategyId => {
                  const displayName = STRATEGY_DISPLAY_NAMES[strategyId] || strategyId.replace(/_/g, " ");
                  const color = STRATEGY_COLORS[strategyId] || "#6b7280";
                  return (
                    <div key={strategyId} className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {displayName}
                    </div>
                  );
                })}
                {/* Fixed legends for signals and sentiment */}
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Sentiment
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Buy Spot
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Sell Spot
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  Buy LP
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
                  Sell LP
                </div>
              </div>
            </div>

            <div className="flex-1 w-full pt-4 pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    {/* Dynamic gradients for each strategy */}
                    {sortedStrategyIds.map(strategyId => {
                      const color = STRATEGY_COLORS[strategyId] || "#6b7280";
                      return (
                        <linearGradient
                          key={`gradient-${strategyId}`}
                          id={`color-${strategyId}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                    tickFormatter={value =>
                      new Date(value).toLocaleDateString(undefined, {
                        month: "short",
                        year: "2-digit",
                      })
                    }
                  />
                  <YAxis
                    domain={yAxisDomain}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={value => `$${(value / 1000).toFixed(0)}k`}
                  />
                  {/* Secondary Y-axis for Sentiment */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 4]}
                    tick={{ fontSize: 10, fill: "#a855f7" }}
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: "Sentiment",
                      angle: 90,
                      position: "insideRight",
                      style: { fontSize: 10, fill: "#a855f7" },
                    }}
                    tickFormatter={(value: number) => {
                      const labels = ["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"];
                      return labels[value] || String(value);
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Dynamic strategy lines */}
                  {sortedStrategyIds.map((strategyId) => {
                    const color = STRATEGY_COLORS[strategyId] || "#6b7280";
                    const displayName = STRATEGY_DISPLAY_NAMES[strategyId] || strategyId.replace(/_/g, " ");
                    // First strategy (smart_dca if present) gets filled area, others get lines
                    const isMainStrategy = strategyId === "smart_dca";
                    const isDcaClassic = strategyId === "dca_classic";

                    return (
                      <Area
                        key={strategyId}
                        type="monotone"
                        dataKey={`${strategyId}_value`}
                        name={displayName}
                        stroke={color}
                        fillOpacity={isMainStrategy ? 1 : 0}
                        fill={isMainStrategy ? `url(#color-${strategyId})` : "transparent"}
                        strokeWidth={2}
                        strokeDasharray={isDcaClassic ? "4 4" : undefined}
                      />
                    );
                  })}

                  {/* Sentiment Line */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="sentiment"
                    name="Sentiment"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={true}
                    strokeOpacity={0.8}
                  />

                  <Scatter
                    name="Buy Spot"
                    dataKey="buySpotSignal"
                    fill="#22c55e"
                    shape="circle"
                    legendType="none"
                  />
                  <Scatter
                    name="Sell Spot"
                    dataKey="sellSpotSignal"
                    fill="#ef4444"
                    shape="circle"
                    legendType="none"
                  />
                  <Scatter
                    name="Buy LP"
                    dataKey="buyLpSignal"
                    fill="#3b82f6"
                    shape="circle"
                    legendType="none"
                  />
                  <Scatter
                    name="Sell LP"
                    dataKey="sellLpSignal"
                    fill="#d946ef"
                    shape="circle"
                    legendType="none"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </BaseCard>
        </div>
      )}
    </div>
  );
};

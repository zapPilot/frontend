"use client";

import { Activity, ChevronDown, ChevronUp, Play, RefreshCw, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BaseCard } from "@/components/ui/BaseCard";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import {
  BacktestRequest,
  BacktestEndpointMode,
  SimpleBacktestRequest,
} from "@/types/backtesting";

import { MetricCard } from "./backtesting/MetricCard";

const DEFAULT_REQUEST: BacktestRequest = {
  token_symbol: "BTC",
  total_capital: 10000, // Split 50% BTC, 50% stables
  days: 500,
  rebalance_step_count: 5,
  rebalance_interval_days: 2,
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
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          if (!entry) return null;

          const name = entry.name || "";
          const value = entry.value;

          // Handle signal entries (Buy Spot, Sell Spot, Buy LP, Sell LP)
          if (
            ["Buy Spot", "Sell Spot", "Buy LP", "Sell LP"].includes(name)
          ) {
            if (value) {
              return (
                <div
                  key={index}
                  className="text-xs"
                  style={{ color: entry.color || "#fff" }}
                >
                  {name}: Signal
                </div>
              );
            }
            return null;
          }

          // Handle value entries (Regime Strategy, Normal DCA)
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
  const [endpointMode, setEndpointMode] =
    useState<BacktestEndpointMode>("full");

  const {
    mutate,
    data: backtestData,
    isPending,
    error,
  } = useBacktestMutation();

  const chartData = useMemo(() => {
    if (!backtestData) return [];
    return backtestData.timeline.map(point => {
      const smartDca = point.strategies.smart_dca;
      const dcaClassic = point.strategies.dca_classic;

      return {
        ...point,
        normal_total_value: dcaClassic.portfolio_value,
        regime_total_value: smartDca.portfolio_value,
        buySpotSignal:
          smartDca.event === "buy_spot" ? smartDca.portfolio_value : null,
        sellSpotSignal:
          smartDca.event === "sell_spot" ? smartDca.portfolio_value : null,
        buyLpSignal:
          smartDca.event === "buy_lp" ? smartDca.portfolio_value : null,
        sellLpSignal:
          smartDca.event === "sell_lp" ? smartDca.portfolio_value : null,
      };
    });
  }, [backtestData]);

  const yAxisDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 1000];

    const allValues: number[] = [];
    chartData.forEach(point => {
      if (point.regime_total_value != null)
        allValues.push(point.regime_total_value);
      if (point.normal_total_value != null)
        allValues.push(point.normal_total_value);
      if (point.buySpotSignal != null) allValues.push(point.buySpotSignal);
      if (point.sellSpotSignal != null) allValues.push(point.sellSpotSignal);
      if (point.buyLpSignal != null) allValues.push(point.buyLpSignal);
      if (point.sellLpSignal != null) allValues.push(point.sellLpSignal);
    });

    if (allValues.length === 0) return [0, 1000];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;

    // Add 5% padding on each side
    const padding = range * 0.05;
    const lowerBound = Math.max(0, min - padding);
    const upperBound = max + padding;

    return [lowerBound, upperBound];
  }, [chartData]);

  const summary = useMemo(() => {
    if (!backtestData) return null;
    return {
      smartDca: backtestData.strategies.smart_dca,
      dcaClassic: backtestData.strategies.dca_classic,
      totalDays: backtestData.timeline.length,
    };
  }, [backtestData]);

  const smartDcaSummary = summary?.smartDca;
  const dcaClassicSummary = summary?.dcaClassic;
  const smartRoi = smartDcaSummary?.roi_percent ?? 0;
  const normalRoi = dcaClassicSummary?.roi_percent ?? 0;
  const smartFinalValue = smartDcaSummary?.final_value ?? 0;
  const normalFinalValue = dcaClassicSummary?.final_value ?? 0;
  const tradeCount = smartDcaSummary?.trade_count ?? 0;
  const totalDays = summary?.totalDays ?? 0;

  const handleRunBacktest = () => {
    if (endpointMode === "simple") {
      // Convert BacktestRequest to SimpleBacktestRequest
      // Only include properties that are defined to satisfy exactOptionalPropertyTypes
      const simpleRequest: SimpleBacktestRequest = {
        token_symbol: params.token_symbol,
        total_capital: params.total_capital,
      };
      
      if (params.start_date !== undefined) {
        simpleRequest.start_date = params.start_date;
      }
      if (params.end_date !== undefined) {
        simpleRequest.end_date = params.end_date;
      }
      if (params.days !== undefined) {
        simpleRequest.days = params.days;
      }
      if (params.rebalance_step_count !== undefined) {
        simpleRequest.rebalance_step_count = params.rebalance_step_count;
      }
      if (params.rebalance_interval_days !== undefined) {
        simpleRequest.rebalance_interval_days = params.rebalance_interval_days;
      }
      
      mutate({ request: simpleRequest, endpointMode: "simple" });
    } else {
      mutate({ request: params, endpointMode: "full" });
    }
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
          {/* Endpoint Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setEndpointMode("full")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                endpointMode === "full"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              Full
            </button>
            <button
              type="button"
              onClick={() => setEndpointMode("simple")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                endpointMode === "simple"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              Simple
            </button>
          </div>
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
          </div>

          {/* Advanced Parameters - Only show in full mode */}
          {endpointMode === "full" && (
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
          )}

          {/* Simple Mode Info */}
          {endpointMode === "simple" && (
            <div className="border-t border-gray-800 pt-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-400 font-medium mb-1">
                  Simple Mode Active
                </p>
                <p className="text-xs text-gray-400">
                  Simple mode hardcodes: Action Regimes = [extreme_fear,
                  extreme_greed] and Use Equal Capital Pool = true. Only acts
                  on extreme market conditions.
                </p>
              </div>
            </div>
          )}
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
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Regime Strategy ROI"
              value={`${smartRoi.toFixed(1)}%`}
              subtext={`vs ${normalRoi > 0 ? "+" : ""}${normalRoi.toFixed(1)}% Normal DCA`}
              highlight
            />
            <MetricCard
              label="Final Value"
              value={`$${smartFinalValue.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}`}
              subtext={`vs $${normalFinalValue.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}`}
            />
            <MetricCard
              label="Trades Executed"
              value={tradeCount.toString()}
              subtext={`${totalDays} days simulated`}
            />

            <MetricCard
              label="Final Value"
              value={`$${summary?.smartDca.final_value.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 0,
                }
              )}`}
              subtext={`vs $${summary?.dcaClassic.final_value.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 0,
                }
              )}`}
            />
            <MetricCard
              label="Trades Executed"
              value={summary?.smartDca.trade_count.toString() ?? "0"}
              subtext={`${summary?.totalDays ?? 0} days simulated`}
            />
          </div>

          {/* Chart */}
          <BaseCard
            variant="glass"
            className="p-1 h-[400px] relative overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-800/50 bg-gray-900/30 flex justify-between items-center">
              <div className="text-sm font-medium text-white flex items-center gap-2">
                Portfolio Value Growth
                <span className="text-xs font-normal text-gray-500">
                  (Last 90 Days)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Regime Strategy
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-gray-600" />
                  Normal DCA
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
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
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
                    <linearGradient
                      id="colorRegime"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
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
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="regime_total_value"
                    name="Regime Strategy"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRegime)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="normal_total_value"
                    name="Normal DCA"
                    stroke="#4b5563"
                    strokeDasharray="4 4"
                    fill="transparent"
                    strokeWidth={2}
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

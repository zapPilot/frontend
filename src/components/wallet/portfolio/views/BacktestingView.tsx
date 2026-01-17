"use client";

import { Activity, Play, RefreshCw, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BaseCard } from "@/components/ui/BaseCard";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import { BacktestRequest } from "@/types/backtesting";

import { MetricCard } from "./backtesting/MetricCard";

const DEFAULT_REQUEST: BacktestRequest = {
  token_symbol: "BTC",
  initial_capital: 10000,
  dca_amount: 100,
  // No start_date/end_date = backend defaults to last 90 days
};

export const BacktestingView = () => {
  const {
    mutate,
    data: backtestData,
    isPending,
    error,
  } = useBacktestMutation();

  const handleRunBacktest = () => {
    mutate(DEFAULT_REQUEST);
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
              value={`${backtestData.summary.regime_roi_percent.toFixed(1)}%`}
              subtext={`vs ${backtestData.summary.normal_roi_percent > 0 ? "+" : ""}${backtestData.summary.normal_roi_percent.toFixed(1)}% Normal DCA`}
              highlight
            />
            <MetricCard
              label="Final Value"
              value={`$${backtestData.summary.regime_final_value.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 0,
                }
              )}`}
              subtext={`vs $${backtestData.summary.normal_final_value.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 0,
                }
              )}`}
            />
            <MetricCard
              label="Trades Executed"
              value={backtestData.summary.regime_trade_count.toString()}
              subtext={`${backtestData.summary.total_days} days simulated`}
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
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Regime Strategy
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-gray-600" />
                  Normal DCA
                </div>
              </div>
            </div>

            <div className="flex-1 w-full pt-4 pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={backtestData.history}>
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
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={value => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      borderColor: "#374151",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: number | undefined) => [
                      `$${(value ?? 0).toLocaleString()}`,
                      "Value",
                    ]}
                    labelFormatter={label =>
                      new Date(label).toLocaleDateString()
                    }
                  />
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
                    dataKey="normal_value"
                    name="Normal DCA"
                    stroke="#4b5563"
                    strokeDasharray="4 4"
                    fill="transparent"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BaseCard>
        </div>
      )}
    </div>
  );
};

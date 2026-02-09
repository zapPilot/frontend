"use client";

import { Play, Settings } from "lucide-react";
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
import { cn } from "@/lib/ui/classNames";

// --- Mock Data ---

const MOCK_PERFORMANCE_DATA = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  value: 1000 + Math.random() * 200 + i * 10,
  benchmark: 1000 + Math.random() * 100 + i * 5,
}));

const METRICS = [
  { label: "Total Return", value: "+32.5%", good: true },
  { label: "Sharpe Ratio", value: "2.1", good: true },
  { label: "Max Drawdown", value: "-12.4%", good: false },
  { label: "Win Rate", value: "65%", good: true },
];

// --- Components ---

function MetricCard({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
      <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={cn(
          "text-2xl font-bold font-mono",
          good ? "text-emerald-400" : "text-rose-400"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function AnalystView() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-3 space-y-4">
          <BaseCard className="p-4 space-y-4 bg-gray-900/40">
            <h3 className="font-bold text-gray-200 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Parameters
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Timeframe
                </label>
                <select className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-sm text-gray-300">
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                  <option>Year to Date</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Strategy
                </label>
                <select className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-sm text-gray-300">
                  <option>Momentum</option>
                  <option>Mean Reversion</option>
                </select>
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <Play className="w-4 h-4" /> Run Backtest
              </button>
            </div>
          </BaseCard>
        </div>

        {/* Charts & Metrics */}
        <div className="lg:col-span-9 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {METRICS.map(m => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>

          <BaseCard className="p-6 h-[400px] bg-gray-900/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-200">Equity Curve</h3>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1 text-purple-400">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />{" "}
                  Strategy
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-gray-600" /> Benchmark
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_PERFORMANCE_DATA}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={value => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    borderColor: "#374151",
                    color: "#f3f4f6",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
                <Area
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#4b5563"
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </BaseCard>
        </div>
      </div>
    </div>
  );
}

export function BacktestingPlayground() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Backtesting Lab</h2>
          <p className="text-sm text-gray-400">
            Simulate strategies with historical data (Mock Mode)
          </p>
        </div>
      </div>

      <div className="min-h-[500px]">
        <AnalystView />
      </div>
    </div>
  );
}

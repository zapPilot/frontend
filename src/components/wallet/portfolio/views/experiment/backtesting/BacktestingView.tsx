"use client";

import {
  Activity,
  BarChart2,
  Layout,
  Play,
  Settings,
  Sliders,
} from "lucide-react";
import { useState } from "react";
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

function VariationSelector({
  active,
  onChange,
}: {
  active: string;
  onChange: (v: string) => void;
}) {
  const variations = [
    { id: "analyst", label: "The Analyst", icon: BarChart2 },
    { id: "simple", label: "The Simpleton", icon: Layout },
    { id: "engineer", label: "The Engineer", icon: Sliders },
  ];

  return (
    <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-800 w-fit mb-6">
      {variations.map(v => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            active === v.id
              ? "bg-purple-500/20 text-purple-300 shadow-sm"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          )}
        >
          <v.icon className="w-4 h-4" />
          {v.label}
        </button>
      ))}
    </div>
  );
}

// --- Variation A: The Analyst (Data Heavy) ---
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

// --- Variation B: The Simpleton (Minimalist) ---
function SimpletonView() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Strategy Simulator</h2>
        <p className="text-gray-400">
          Adjust risk levels and see potential outcomes.
        </p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-lg font-medium text-gray-200">
              Risk Appetite
            </label>
            <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-bold">
              Aggressive
            </span>
          </div>
          <input
            type="range"
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-xs text-gray-500 uppercase font-bold tracking-widest">
            <span>Conservative</span>
            <span>Balanced</span>
            <span>Degen</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-800">
          <div className="text-center space-y-1">
            <div className="text-sm text-gray-500">Expected ROI</div>
            <div className="text-4xl font-bold text-emerald-400">+124%</div>
            <div className="text-xs text-emerald-500/60">Annualized</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-sm text-gray-500">Max Drawdown</div>
            <div className="text-4xl font-bold text-rose-400">-22%</div>
            <div className="text-xs text-rose-500/60">Worst Case</div>
          </div>
        </div>

        <button className="w-full bg-white text-black font-bold text-lg py-4 rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
          Apply Settings
        </button>
      </div>
    </div>
  );
}

// --- Variation C: The Engineer (Technical) ---
function EngineerView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <BaseCard className="p-0 overflow-hidden bg-gray-900/40 border-gray-800">
        <div className="bg-gray-950 p-3 border-b border-gray-800 flex items-center justify-between">
          <span className="font-mono text-xs text-gray-400 uppercase">
            Configuration
          </span>
          <Activity className="w-4 h-4 text-purple-500" />
        </div>
        <div className="p-4 space-y-4">
          {[
            "Signal Threshold",
            "Stop Loss %",
            "Take Profit %",
            "Leverage Cap",
          ].map(label => (
            <div
              key={label}
              className="flex items-center justify-between group"
            >
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                {label}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue="0.5"
                  className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-right text-sm text-purple-300 w-16 font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </BaseCard>

      <BaseCard className="p-0 overflow-hidden bg-gray-900/40 border-gray-800">
        <div className="bg-gray-950 p-3 border-b border-gray-800 flex items-center justify-between">
          <span className="font-mono text-xs text-gray-400 uppercase">
            Simulation Log
          </span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/20" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
            <div className="w-2 h-2 rounded-full bg-green-500/20" />
          </div>
        </div>
        <div className="p-4 font-mono text-xs space-y-2 h-[200px] overflow-y-auto">
          <div className="text-gray-500">
            [09:00:00] Init Backtest Engine v2
          </div>
          <div className="text-blue-400">
            [09:00:01] Loading historical data...
          </div>
          <div className="text-gray-300">
            [09:00:02] Processing 1,402 candles
          </div>
          <div className="text-emerald-400">
            [09:00:05] Signal Triggered: BUY @ $42,100
          </div>
          <div className="text-gray-300">[09:00:05] Position Size: 1.2 BTC</div>
          <div className="text-rose-400">
            [14:20:00] Stop Loss Hit @ $41,800
          </div>
          <div className="text-gray-500">...</div>
        </div>
      </BaseCard>

      <div className="md:col-span-2">
        <BaseCard className="p-6 bg-gray-900/40">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white">Optimization Heatmap</h3>
            <div className="flex gap-2">
              <span className="text-xs text-emerald-400">High ROI</span>
              <span className="text-xs text-rose-400">Low ROI</span>
            </div>
          </div>
          <div className="grid grid-cols-10 gap-1 h-32">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="rounded-sm hover:ring-1 ring-white/50 transition-all cursor-crosshair"
                style={{
                  backgroundColor: `hsl(${140 + Math.random() * 100}, 70%, ${20 + Math.random() * 40}%)`,
                  opacity: 0.5 + Math.random() * 0.5,
                }}
                title={`Param Set #${i}`}
              />
            ))}
          </div>
        </BaseCard>
      </div>
    </div>
  );
}

export function BacktestingPlayground() {
  const [variation, setVariation] = useState("analyst");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Backtesting Lab</h2>
          <p className="text-sm text-gray-400">
            Simulate strategies with historical data (Mock Mode)
          </p>
        </div>
        <VariationSelector active={variation} onChange={setVariation} />
      </div>

      <div className="min-h-[500px]">
        {variation === "analyst" && <AnalystView />}
        {variation === "simple" && <SimpletonView />}
        {variation === "engineer" && <EngineerView />}
      </div>
    </div>
  );
}

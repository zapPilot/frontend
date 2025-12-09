"use client";

import {
  ArrowUpRight,
  Calendar,
  Download,
  Info,
  TrendingUp,
} from "lucide-react";

import { BaseCard } from "@/components/ui/BaseCard";

// Mock Data for Analytics
const MOCK_ANALYTICS = {
  metrics: [
    {
      label: "Time-Weighted Return",
      value: "+124.5%",
      subValue: "+2.4% vs BTC",
      trend: "up",
      info: "Compound return excluding cash flows",
    },
    {
      label: "Max Drawdown",
      value: "-12.8%",
      subValue: "Better than -25% Benchmark",
      trend: "up",
      info: "Largest peak-to-trough decline",
    },
    {
      label: "Sharpe Ratio",
      value: "2.45",
      subValue: "Top 5% of Pilots",
      trend: "up",
      info: "Risk-adjusted return metric",
    },
    {
      label: "Win Rate",
      value: "68%",
      subValue: "34 winning months",
      trend: "up",
      info: "Percentage of profitable periods",
    },
  ],
  monthlyPnL: [
    // 2024
    { month: "Jan", year: 2024, value: 5.2 },
    { month: "Feb", year: 2024, value: 8.4 },
    { month: "Mar", year: 2024, value: -2.1 },
    { month: "Apr", year: 2024, value: 4.5 },
    { month: "May", year: 2024, value: 1.2 },
    { month: "Jun", year: 2024, value: -0.5 },
    { month: "Jul", year: 2024, value: 6.8 },
    { month: "Aug", year: 2024, value: 3.2 },
    { month: "Sep", year: 2024, value: -1.8 },
    { month: "Oct", year: 2024, value: 9.5 },
    { month: "Nov", year: 2024, value: 4.1 },
    { month: "Dec", year: 2024, value: 2.2 },
  ],
};

const CustomAreaChart = () => {
  // Simplified SVG path construction for demo
  const points = [
    [0, 80],
    [10, 75],
    [20, 78],
    [30, 60],
    [40, 65],
    [50, 45],
    [60, 50],
    [70, 30],
    [80, 25],
    [90, 15],
    [100, 10],
  ];
  const pathData = `M 0,100 L ${points.map(p => `${p[0]},${p[1]}`).join(" L ")} L 100,100 Z`;
  const linePathData = `M ${points.map(p => `${p[0]},${p[1]}`).join(" L ")}`;

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-xl bg-gray-900/30 border border-gray-800">
      {/* Grid Lines */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="w-full h-px bg-gray-800/30 absolute"
            style={{ top: `${i * 25}%` }}
          />
        ))}
      </div>

      {/* Chart Area */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={pathData} fill="url(#chartGradient)" />
        <path
          d={linePathData}
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Regime Overlay (Background Bands) */}
      <div className="absolute inset-0 flex pointer-events-none opacity-10">
        <div className="w-[30%] h-full bg-red-500" title="Fear" />
        <div className="w-[40%] h-full bg-yellow-500" title="Neutral" />
        <div className="w-[30%] h-full bg-green-500" title="Greed" />
      </div>

      {/* Labels */}
      <div className="absolute bottom-2 left-4 text-xs text-gray-500 font-mono">
        Jan 24
      </div>
      <div className="absolute bottom-2 right-4 text-xs text-gray-500 font-mono">
        Dec 24
      </div>
    </div>
  );
};

export const AnalyticsView = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Flight Recorder
          </h2>
          <p className="text-sm text-gray-400">
            Performance analysis and historical regime data
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700">
          <Download className="w-3.5 h-3.5" />
          Export Report
        </button>
      </div>

      {/* Primary Chart Section */}
      <BaseCard variant="glass" className="p-1">
        <div className="p-4 border-b border-gray-800/50 flex justify-between items-center bg-gray-900/40 rounded-t-xl">
          <div className="flex gap-2 text-sm">
            <span className="text-white font-medium">
              Net Worth Performance
            </span>
            <span className="text-gray-500">vs. Bitcoin</span>
          </div>
          <div className="flex gap-2">
            {["1M", "3M", "6M", "1Y", "ALL"].map(period => (
              <button
                key={period}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${period === "1Y" ? "bg-purple-500/20 text-purple-300" : "text-gray-500 hover:text-gray-300"}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          <CustomAreaChart />
        </div>
      </BaseCard>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_ANALYTICS.metrics.map((metric, idx) => (
          <BaseCard
            key={idx}
            variant="glass"
            className="p-4 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                {metric.label}
                <Info className="w-3 h-3 text-gray-600 cursor-help" />
              </span>
              <span className={`p-1 rounded bg-green-500/10 text-green-400`}>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-xl font-bold text-white tracking-tight mb-1">
              {metric.value}
            </div>
            <div className="text-xs text-gray-400">{metric.subValue}</div>
          </BaseCard>
        ))}
      </div>

      {/* PnL Heatmap */}
      <BaseCard variant="glass" className="p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          Monthly PnL Heatmap
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {MOCK_ANALYTICS.monthlyPnL.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div
                className={`h-12 rounded-md flex items-center justify-center text-xs font-medium transition-transform hover:scale-105 cursor-pointer ${
                  item.value > 0
                    ? `bg-green-500/${Math.min(20 + item.value * 5, 80)} text-green-300 border border-green-500/20`
                    : `bg-red-500/${Math.min(20 + Math.abs(item.value) * 5, 80)} text-red-300 border border-red-500/20`
                }`}
              >
                {item.value > 0 ? "+" : ""}
                {item.value}%
              </div>
              <span className="text-[10px] text-center text-gray-500 font-mono uppercase">
                {item.month}
              </span>
            </div>
          ))}
        </div>
      </BaseCard>
    </div>
  );
};

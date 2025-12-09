"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Download,
  Info,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import { BaseCard } from "@/components/ui/BaseCard";

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_ANALYTICS = {
  // Key metrics (static values - don't need charts)
  metrics: [
    {
      label: "Time-Weighted Return",
      value: "+124.5%",
      subValue: "+2.4% vs BTC",
      trend: "up",
    },
    {
      label: "Max Drawdown",
      value: "-12.8%",
      subValue: "Recovered in 14 days",
      trend: "up",
    },
    {
      label: "Sharpe Ratio",
      value: "2.45",
      subValue: "Top 5% of Pilots",
      trend: "up",
    },
    {
      label: "Win Rate",
      value: "68%",
      subValue: "34 winning months",
      trend: "up",
    },
  ],

  // Net Worth over time (cumulative growth)
  netWorthHistory: [
    { x: 0, portfolio: 80, btc: 85 },
    { x: 10, portfolio: 72, btc: 78 },
    { x: 20, portfolio: 68, btc: 82 },
    { x: 30, portfolio: 55, btc: 70 },
    { x: 40, portfolio: 50, btc: 65 },
    { x: 50, portfolio: 40, btc: 55 },
    { x: 60, portfolio: 35, btc: 60 },
    { x: 70, portfolio: 25, btc: 45 },
    { x: 80, portfolio: 20, btc: 40 },
    { x: 90, portfolio: 12, btc: 30 },
    { x: 100, portfolio: 8, btc: 25 },
  ],

  // Drawdown over time (underwater chart) - shows resilience
  drawdownHistory: [
    { x: 0, value: 0 },
    { x: 8, value: -2 },
    { x: 16, value: -5 },
    { x: 24, value: -1 },
    { x: 32, value: 0 },
    { x: 40, value: -3 },
    { x: 48, value: -8 },
    { x: 56, value: -12.8 }, // Max drawdown point
    { x: 64, value: -6 },
    { x: 72, value: -2 },
    { x: 80, value: 0 },
    { x: 88, value: -4 },
    { x: 96, value: -2 },
    { x: 100, value: 0 },
  ],

  // Monthly PnL for heatmap
  monthlyPnL: [
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

// ============================================================================
// CHART COMPONENTS
// ============================================================================

/** Net Worth Performance Chart - Shows portfolio vs benchmark over time */
const PerformanceChart = () => {
  const data = MOCK_ANALYTICS.netWorthHistory;

  // Build SVG paths
  const portfolioPath = data.map(p => `${p.x},${p.portfolio}`).join(" L ");
  const btcPath = data.map(p => `${p.x},${p.btc}`).join(" L ");

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-xl bg-gray-900/30 border border-gray-800">
      {/* Grid Lines */}
      <div className="absolute inset-0">
        {[0, 25, 50, 75, 100].map(y => (
          <div
            key={y}
            className="absolute w-full h-px bg-gray-800/40"
            style={{ top: `${y}%` }}
          />
        ))}
      </div>

      {/* Chart */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Portfolio Area Fill */}
        <path
          d={`M 0,100 L ${portfolioPath} L 100,100 Z`}
          fill="url(#portfolioGradient)"
        />

        {/* Portfolio Line */}
        <path
          d={`M ${portfolioPath}`}
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {/* BTC Benchmark Line (dashed) */}
        <path
          d={`M ${btcPath}`}
          fill="none"
          stroke="#F7931A"
          strokeWidth="1"
          strokeDasharray="4 2"
          vectorEffect="non-scaling-stroke"
          opacity="0.6"
        />
      </svg>

      {/* Regime Overlay */}
      <div className="absolute inset-0 flex pointer-events-none opacity-5">
        <div className="w-[30%] h-full bg-red-500" />
        <div className="w-[40%] h-full bg-yellow-500" />
        <div className="w-[30%] h-full bg-green-500" />
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 flex gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-purple-500 rounded" />
          <span className="text-gray-400">Portfolio</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-orange-500 rounded opacity-60" />
          <span className="text-gray-400">BTC</span>
        </div>
      </div>

      {/* Time Labels */}
      <div className="absolute bottom-2 left-4 text-xs text-gray-500 font-mono">
        Jan 24
      </div>
      <div className="absolute bottom-2 right-4 text-xs text-gray-500 font-mono">
        Dec 24
      </div>
    </div>
  );
};

/** Underwater/Drawdown Chart - Shows how deep drawdowns go and recovery speed */
const DrawdownChart = () => {
  const data = MOCK_ANALYTICS.drawdownHistory;

  // Normalize: 0% drawdown = y:0, -15% drawdown = y:100
  const maxDrawdown = 15; // Scale to -15%
  const points = data
    .map(p => `${p.x},${(Math.abs(p.value) / maxDrawdown) * 100}`)
    .join(" L ");

  return (
    <div className="relative w-full h-40 overflow-hidden rounded-xl bg-gray-900/30 border border-gray-800">
      {/* Grid Lines */}
      <div className="absolute inset-0">
        {[0, 33, 66, 100].map(y => (
          <div
            key={y}
            className="absolute w-full h-px bg-gray-800/40"
            style={{ top: `${y}%` }}
          />
        ))}
      </div>

      {/* Zero Line (at top) */}
      <div className="absolute top-0 w-full h-px bg-gray-600" />

      {/* Chart */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Drawdown Area */}
        <path d={`M 0,0 L ${points} L 100,0 Z`} fill="url(#drawdownGradient)" />

        {/* Drawdown Line */}
        <path
          d={`M ${points}`}
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Y-Axis Labels */}
      <div className="absolute right-2 top-0 h-full flex flex-col justify-between py-1 text-[10px] text-gray-600 font-mono text-right">
        <span>0%</span>
        <span>-5%</span>
        <span>-10%</span>
        <span>-15%</span>
      </div>

      {/* Max Drawdown Annotation */}
      <div className="absolute left-[56%] top-[85%] transform -translate-x-1/2">
        <div className="text-[10px] text-red-400 font-bold whitespace-nowrap">
          -12.8% Max
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AnalyticsView = () => {
  const [activeChartTab, setActiveChartTab] = useState<
    "performance" | "drawdown"
  >("performance");

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

      {/* Primary Chart Section with Tabs */}
      <BaseCard variant="glass" className="p-1">
        <div className="p-4 border-b border-gray-800/50 flex justify-between items-center bg-gray-900/40 rounded-t-xl">
          {/* Chart Type Tabs */}
          <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg">
            {[
              { id: "performance", label: "Performance", icon: TrendingUp },
              { id: "drawdown", label: "Drawdown", icon: ArrowDownRight },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveChartTab(tab.id as "performance" | "drawdown")
                }
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeChartTab === tab.id
                    ? "bg-gray-700 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Time Period Selector */}
          <div className="flex gap-2">
            {["1M", "3M", "6M", "1Y", "ALL"].map(period => (
              <button
                key={period}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                  period === "1Y"
                    ? "bg-purple-500/20 text-purple-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {activeChartTab === "performance" && <PerformanceChart />}
          {activeChartTab === "drawdown" && (
            <div className="space-y-3">
              <DrawdownChart />
              <p className="text-xs text-gray-500">
                <span className="text-white font-medium">
                  Resilience Analysis:
                </span>{" "}
                Maximum drawdown of -12.8% with an average recovery time of 14
                days. This is 52% better than the Bitcoin benchmark (-25%).
              </p>
            </div>
          )}
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
              <span className="p-1 rounded bg-green-500/10 text-green-400">
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

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BaseCard variant="glass" className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Activity className="w-3.5 h-3.5" />
            Sortino Ratio
          </div>
          <div className="text-lg font-mono text-white">3.12</div>
          <div className="text-[10px] text-gray-500">vs 1.2 Benchmark</div>
        </BaseCard>
        <BaseCard variant="glass" className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Activity className="w-3.5 h-3.5" />
            Beta (vs BTC)
          </div>
          <div className="text-lg font-mono text-white">0.35</div>
          <div className="text-[10px] text-blue-400">Low Correlation</div>
        </BaseCard>
        <BaseCard variant="glass" className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Activity className="w-3.5 h-3.5" />
            Volatility
          </div>
          <div className="text-lg font-mono text-white">18.2%</div>
          <div className="text-[10px] text-gray-500">Annualized</div>
        </BaseCard>
        <BaseCard variant="glass" className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Activity className="w-3.5 h-3.5" />
            Alpha
          </div>
          <div className="text-lg font-mono text-green-400">+4.2%</div>
          <div className="text-[10px] text-gray-500">Excess Return</div>
        </BaseCard>
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
                    ? "bg-green-500/20 text-green-300 border border-green-500/20"
                    : "bg-red-500/20 text-red-300 border border-red-500/20"
                }`}
                style={{
                  opacity:
                    item.value > 0
                      ? Math.min(0.4 + item.value * 0.06, 1)
                      : Math.min(0.4 + Math.abs(item.value) * 0.1, 1),
                }}
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

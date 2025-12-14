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
import { useMemo, useState } from "react";

import { ChartIndicator, ChartTooltip } from "@/components/charts";
import { BaseCard } from "@/components/ui/BaseCard";
import { useAnalyticsData } from "@/hooks/queries/useAnalyticsData";
import { useChartHover } from "@/hooks/useChartHover";
import type { AnalyticsTimePeriod } from "@/types/analytics";
import type {
  DrawdownHoverData,
  PerformanceHoverData,
} from "@/types/ui/chartHover";

// ============================================================================
// PROPS & TYPES
// ============================================================================

interface AnalyticsViewProps {
  userId: string;
}

// ============================================================================
// LOADING & ERROR STATES
// ============================================================================

const AnalyticsLoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header skeleton */}
    <div className="h-12 bg-gray-800/30 rounded-lg w-1/3" />

    {/* Chart skeleton */}
    <div className="h-64 bg-gray-800/30 rounded-xl" />

    {/* Metrics grid skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-800/30 rounded-xl" />
      ))}
    </div>

    {/* Additional metrics skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-800/30 rounded-xl" />
      ))}
    </div>
  </div>
);

const AnalyticsErrorState = ({ error, onRetry }: { error: any; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
      <Info className="w-8 h-8 text-red-400" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">
      Failed to Load Analytics Data
    </h3>
    <p className="text-sm text-gray-400 mb-6 text-center max-w-md">
      {error?.message || "Unable to fetch analytics data. Please try again."}
    </p>
    <button
      onClick={onRetry}
      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
    >
      Retry
    </button>
  </div>
);

// ============================================================================
// ============================================================================
// REUSABLE CHART HELPERS
// ============================================================================

/** Reusable grid lines for charts */
const ChartGridLines = ({ positions }: { positions: number[] }) => (
  <div className="absolute inset-0">
    {positions.map(y => (
      <div
        key={y}
        className="absolute w-full h-px bg-gray-800/40"
        style={{ top: `${y}%` }}
      />
    ))}
  </div>
);

/** Reusable Y-axis labels for drawdown-style charts */
const YAxisLabels = ({
  labels,
  alignment = "right",
}: {
  labels: string[];
  alignment?: "left" | "right";
}) => (
  <div
    className={`absolute ${alignment === "right" ? "right-2" : "left-2"} top-0 h-full flex flex-col justify-between py-1 text-[10px] text-gray-600 font-mono text-${alignment}`}
  >
    {labels.map((label, idx) => (
      <span key={idx}>{label}</span>
    ))}
  </div>
);

/** Reusable metric card for analytics metrics */
const AnalyticsMetricCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  valueColor = "text-white",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue: string;
  valueColor?: string;
}) => (
  <BaseCard variant="glass" className="p-4">
    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <div className={`text-lg font-mono ${valueColor}`}>{value}</div>
    <div className="text-[10px] text-gray-500">{subValue}</div>
  </BaseCard>
);

// ============================================================================
// CHART COMPONENTS
// ============================================================================

/** Net Worth Performance Chart - Shows portfolio vs benchmark over time */
const PerformanceChart = ({
  chartData,
  width = 800,
  height = 300,
}: {
  chartData: {
    x: number;
    portfolio: number;
    btc: number;
    date: string;
    portfolioValue: number;
  }[];
  width?: number;
  height?: number;
}) => {
  const data = chartData;

  // Calculate min/max for Y-axis scaling
  const minValue = useMemo(
    () => Math.min(...data.map((d) => d.portfolioValue)),
    [data]
  );
  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.portfolioValue)),
    [data]
  );

  // Chart hover with tooltip
  const performanceHover = useChartHover(data, {
    chartType: "performance",
    chartWidth: width,
    chartHeight: height,
    chartPadding: 0,
    minValue,
    maxValue,
    getYValue: (point) => point.portfolioValue,
    buildHoverData: (point, x, y): PerformanceHoverData => ({
      chartType: "performance",
      x,
      y,
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      value: point.portfolioValue,
      benchmark: 0, // BTC benchmark not available yet
    }),
  });

  // Build SVG paths - convert normalized 0-100 coords to pixel coords
  const portfolioPath = data
    .map((p) => {
      const x = (p.x / 100) * width;
      const y = (p.portfolio / 100) * height;
      return `${x},${y}`;
    })
    .join(" L ");
  const btcPath = data
    .map((p) => {
      const x = (p.x / 100) * width;
      const y = (p.btc / 100) * height;
      return `${x},${y}`;
    })
    .join(" L ");

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-xl bg-gray-900/30 border border-gray-800 cursor-pointer hover:bg-gray-900/40 hover:border-gray-700/80 transition-all duration-200 group">
      {/* Grid Lines */}
      <ChartGridLines positions={[0, 25, 50, 75, 100]} />

      {/* Chart SVG with hover handlers */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        onMouseMove={performanceHover.handleMouseMove}
        onMouseLeave={performanceHover.handleMouseLeave}
        onPointerMove={performanceHover.handlePointerMove}
        onPointerDown={performanceHover.handlePointerDown}
        onTouchMove={performanceHover.handleTouchMove}
        onTouchEnd={performanceHover.handleTouchEnd}
        style={{ touchAction: "none" }}
      >
        <defs>
          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Portfolio Area Fill */}
        <path
          d={`M 0,${height} L ${portfolioPath} L ${width},${height} Z`}
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

        {/* Hover indicator */}
        <ChartIndicator hoveredPoint={performanceHover.hoveredPoint} />
      </svg>

      {/* Regime Overlay */}
      <div className="absolute inset-0 flex pointer-events-none opacity-5">
        <div className="w-[30%] h-full bg-red-500" />
        <div className="w-[40%] h-full bg-yellow-500" />
        <div className="w-[30%] h-full bg-green-500" />
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 flex gap-4 text-[10px] pointer-events-none">
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

      {/* Tooltip */}
      <ChartTooltip
        hoveredPoint={performanceHover.hoveredPoint}
        chartWidth={width}
        chartHeight={height}
      />
    </div>
  );
};

/** Underwater/Drawdown Chart - Shows how deep drawdowns go and recovery speed */
const DrawdownChart = ({
  chartData,
  maxDrawdown,
  width = 800,
  height = 200,
}: {
  chartData: { x: number; value: number; date: string }[];
  maxDrawdown: number;
  width?: number;
  height?: number;
}) => {
  const data = chartData;

  // Calculate min/max for Y-axis scaling
  const minValue = useMemo(() => Math.min(...data.map((d) => d.value), 0), [data]);
  const maxValue = 0; // Zero line at top

  // Chart hover with tooltip
  const drawdownHover = useChartHover(data, {
    chartType: "drawdown-recovery",
    chartWidth: width,
    chartHeight: height,
    chartPadding: 0,
    minValue,
    maxValue,
    getYValue: (point) => point.value,
    buildHoverData: (point, x, y): DrawdownHoverData => ({
      chartType: "drawdown-recovery",
      x,
      y,
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      drawdown: point.value,
    }),
  });

  // Normalize drawdown values to SVG coordinates
  // 0% drawdown = y:0 (top), maxDrawdown = y:height (bottom)
  const drawdownScale = Math.abs(minValue) || 15; // Use actual min or fallback to 15%
  const points = data
    .map((p) => {
      const x = (p.x / 100) * width;
      const y = (Math.abs(p.value) / drawdownScale) * height;
      return `${x},${y}`;
    })
    .join(" L ");

  return (
    <div className="relative w-full h-40 overflow-hidden rounded-xl bg-gray-900/30 border border-gray-800 cursor-pointer hover:bg-gray-900/40 hover:border-gray-700/80 transition-all duration-200 group">
      {/* Grid Lines */}
      <ChartGridLines positions={[0, 33, 66, 100]} />

      {/* Zero Line (at top) */}
      <div className="absolute top-0 w-full h-px bg-gray-600" />

      {/* Chart SVG with hover handlers */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        onMouseMove={drawdownHover.handleMouseMove}
        onMouseLeave={drawdownHover.handleMouseLeave}
        onPointerMove={drawdownHover.handlePointerMove}
        onPointerDown={drawdownHover.handlePointerDown}
        onTouchMove={drawdownHover.handleTouchMove}
        onTouchEnd={drawdownHover.handleTouchEnd}
        style={{ touchAction: "none" }}
      >
        <defs>
          <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Drawdown Area */}
        <path d={`M 0,0 L ${points} L ${width},0 Z`} fill="url(#drawdownGradient)" />

        {/* Drawdown Line */}
        <path
          d={`M ${points}`}
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* Hover indicator */}
        <ChartIndicator hoveredPoint={drawdownHover.hoveredPoint} />
      </svg>

      {/* Y-Axis Labels */}
      <YAxisLabels labels={["0%", "-5%", "-10%", "-15%"]} />

      {/* Legend (NEW) */}
      <div className="absolute top-2 right-2 flex gap-2 text-[10px] pointer-events-none">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-500 rounded" />
          <span className="text-gray-400">Drawdown</span>
        </div>
      </div>

      {/* Max Drawdown Annotation */}
      <div className="absolute left-[56%] top-[85%] transform -translate-x-1/2 pointer-events-none">
        <div className="text-[10px] text-red-400 font-bold whitespace-nowrap">
          {maxDrawdown.toFixed(1)}% Max
        </div>
      </div>

      {/* Tooltip */}
      <ChartTooltip
        hoveredPoint={drawdownHover.hoveredPoint}
        chartWidth={width}
        chartHeight={height}
      />
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AnalyticsView = ({ userId }: AnalyticsViewProps) => {
  // Time period definitions
  const TIME_PERIODS: AnalyticsTimePeriod[] = [
    { key: "1M", days: 30, label: "1M" },
    { key: "3M", days: 90, label: "3M" },
    { key: "6M", days: 180, label: "6M" },
    { key: "1Y", days: 365, label: "1Y" },
    { key: "ALL", days: 730, label: "ALL" },
  ];

  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsTimePeriod>(TIME_PERIODS[3]!); // 1Y default
  const [activeChartTab, setActiveChartTab] = useState<
    "performance" | "drawdown"
  >("performance");

  // Fetch real data
  const { data, isLoading, error, refetch } = useAnalyticsData(userId, selectedPeriod);

  // Handle states
  if (isLoading) return <AnalyticsLoadingSkeleton />;
  if (error || !data) return <AnalyticsErrorState error={error} onRetry={refetch} />;

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
            {TIME_PERIODS.map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period)}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                  selectedPeriod.key === period.key
                    ? "bg-purple-500/20 text-purple-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {activeChartTab === "performance" && <PerformanceChart chartData={data.performanceChart.points} />}
          {activeChartTab === "drawdown" && (
            <div className="space-y-3">
              <DrawdownChart
                chartData={data.drawdownChart.points}
                maxDrawdown={data.drawdownChart.maxDrawdown}
              />
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
        {[
          {
            label: "Time-Weighted Return",
            value: data.keyMetrics.timeWeightedReturn.value,
            subValue: data.keyMetrics.timeWeightedReturn.subValue,
            trend: data.keyMetrics.timeWeightedReturn.trend,
          },
          {
            label: "Max Drawdown",
            value: data.keyMetrics.maxDrawdown.value,
            subValue: data.keyMetrics.maxDrawdown.subValue,
            trend: data.keyMetrics.maxDrawdown.trend,
          },
          {
            label: "Sharpe Ratio",
            value: data.keyMetrics.sharpe.value,
            subValue: data.keyMetrics.sharpe.subValue,
            trend: data.keyMetrics.sharpe.trend,
          },
          {
            label: "Win Rate",
            value: data.keyMetrics.winRate.value,
            subValue: data.keyMetrics.winRate.subValue,
            trend: data.keyMetrics.winRate.trend,
          },
        ].map((metric, idx) => (
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
              <span className={`p-1 rounded ${
                metric.trend === "up"
                  ? "bg-green-500/10 text-green-400"
                  : metric.trend === "down"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-gray-500/10 text-gray-400"
              }`}>
                {metric.trend === "up" ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : metric.trend === "down" ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <Activity className="w-3.5 h-3.5" />
                )}
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
        <AnalyticsMetricCard
          icon={Activity}
          label="Sortino Ratio"
          value={data.keyMetrics.sortino?.value || "N/A"}
          subValue={data.keyMetrics.sortino?.subValue || "Coming soon"}
        />
        <AnalyticsMetricCard
          icon={Activity}
          label="Beta (vs BTC)"
          value={data.keyMetrics.beta?.value || "N/A"}
          subValue={data.keyMetrics.beta?.subValue || "vs BTC"}
        />
        <AnalyticsMetricCard
          icon={Activity}
          label="Volatility"
          value={data.keyMetrics.volatility.value}
          subValue={data.keyMetrics.volatility.subValue}
        />
        <AnalyticsMetricCard
          icon={Activity}
          label="Alpha"
          value={data.keyMetrics.alpha?.value || "N/A"}
          subValue={data.keyMetrics.alpha?.subValue || "Excess Return"}
          {...(data.keyMetrics.alpha?.value?.startsWith('+') && { valueColor: "text-green-400" })}
        />
      </div>

      {/* PnL Heatmap */}
      <BaseCard variant="glass" className="p-6">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          Monthly PnL Heatmap
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {data.monthlyPnL.length > 0 ? (
            data.monthlyPnL.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div
                  className={`h-12 rounded-md flex items-center justify-center text-xs font-medium transition-transform hover:scale-105 cursor-pointer ${
                    item.value > 0
                      ? "bg-green-500/20 text-green-300 border border-green-500/20"
                      : item.value < 0
                      ? "bg-red-500/20 text-red-300 border border-red-500/20"
                      : "bg-gray-800/50 text-gray-400 border border-gray-700/30"
                  }`}
                  style={{
                    opacity:
                      item.value > 0
                        ? Math.min(0.4 + item.value * 0.06, 1)
                        : item.value < 0
                        ? Math.min(0.4 + Math.abs(item.value) * 0.1, 1)
                        : 0.3,
                  }}
                >
                  {item.value > 0 ? "+" : ""}
                  {item.value.toFixed(1)}%
                </div>
                <span className="text-[10px] text-center text-gray-500 font-mono uppercase">
                  {item.month}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-12 text-center text-gray-500 py-8">
              No monthly data available for this period
            </div>
          )}
        </div>
      </BaseCard>
    </div>
  );
};

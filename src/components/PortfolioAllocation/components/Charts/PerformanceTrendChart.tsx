"use client";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { BaseCard } from "@/components/ui";
import { Z_INDEX } from "@/constants/design-system";
import { formatPercentage } from "@/lib/formatters";
import { ensureNonNegative } from "@/lib/mathUtils";

// APR data point interface
interface APRDataPoint {
  date: string;
  apr: number;
  displayDate: string;
}

// Utility functions for SVG chart generation
const generateAPRSVGPath = (
  data: APRDataPoint[],
  width = 800,
  height = 120,
  padding = 20
): string => {
  if (data.length === 0) return "";

  const values = data.map(d => d.apr);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = Math.max(maxValue - minValue, 1);

  const points = data.map((point, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y =
      height -
      padding -
      ((point.apr - minValue) / valueRange) * (height - 2 * padding);
    return { x, y };
  });

  return points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    )
    .join(" ");
};

const generateAPRAreaPath = (
  data: APRDataPoint[],
  width = 800,
  height = 120,
  padding = 20
): string => {
  const linePath = generateAPRSVGPath(data, width, height, padding);
  if (!linePath) return "";

  return `${linePath} L ${width} ${height - padding} L 0 ${height - padding} Z`;
};

// Mock historical data generator - in real app this would come from API
const generateHistoricalAPR = (
  days: number,
  filtered = false
): APRDataPoint[] => {
  const data: APRDataPoint[] = [];
  const baseAPR = filtered ? 16.2 : 18.5; // Lower APR when categories filtered
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Add some realistic variation with slight upward trend
    const variation = (Math.random() - 0.5) * 4; // ±2% variation
    const trendAdjustment = (days - i) * 0.02; // Slight upward trend
    const apr = ensureNonNegative(baseAPR + variation + trendAdjustment);

    data.push({
      date: date.toISOString().split("T")[0] || date.toISOString(),
      apr: parseFloat(apr.toFixed(2)),
      displayDate:
        i === 0
          ? "Today"
          : i <= 7
            ? `${i}d ago`
            : date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
    });
  }

  return data;
};

interface PerformanceTrendChartProps {
  excludedCategoryIds: string[];
  className?: string;
}

type TimeframePeriod = "7d" | "30d" | "90d";

const TIMEFRAME_OPTIONS: {
  value: TimeframePeriod;
  label: string;
  days: number;
}[] = [
  { value: "7d", label: "7 Days", days: 7 },
  { value: "30d", label: "30 Days", days: 30 },
  { value: "90d", label: "90 Days", days: 90 },
];

export function PerformanceTrendChart({
  excludedCategoryIds,
  className = "",
}: PerformanceTrendChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<TimeframePeriod>("30d");
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    apr: number;
    date: string;
  } | null>(null);

  const {
    chartData,
    fullPortfolioData,
    isFiltered,
    currentAPR,
    trend,
    interpretationText,
  } = useMemo(() => {
    const timeframeDays =
      TIMEFRAME_OPTIONS.find(t => t.value === selectedTimeframe)?.days || 30;
    const isFiltered = excludedCategoryIds.length > 0;

    const chartData = generateHistoricalAPR(timeframeDays, isFiltered);
    const fullPortfolioData = isFiltered
      ? generateHistoricalAPR(timeframeDays, false)
      : null;

    const currentAPR = chartData[chartData.length - 1]?.apr || 0;
    const previousAPR = chartData[0]?.apr || 0;
    const trend = currentAPR > previousAPR ? "up" : "down";

    const change = Math.abs(currentAPR - previousAPR);
    const direction = trend === "up" ? "upward" : "downward";
    const interpretationText = `Trending ${direction} over ${selectedTimeframe} (${formatPercentage(trend === "up" ? change : -change, true, 1)})`;

    return {
      chartData,
      fullPortfolioData,
      isFiltered,
      currentAPR,
      trend,
      interpretationText,
    };
  }, [selectedTimeframe, excludedCategoryIds]);

  const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
    const svgRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - svgRect.left;
    const relativeX = (x / svgRect.width) * 800;

    // Find closest data point
    const dataPointIndex = Math.round(
      (relativeX / 800) * (chartData.length - 1)
    );
    if (dataPointIndex >= 0 && dataPointIndex < chartData.length) {
      const dataPoint = chartData[dataPointIndex];
      if (dataPoint) {
        setHoveredPoint({
          x: relativeX,
          y: event.clientY - svgRect.top,
          apr: dataPoint.apr,
          date: dataPoint.displayDate,
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <BaseCard
      variant="glass"
      padding="xl"
      borderRadius="2xl"
      animate={true}
      className={`bg-gradient-to-br from-slate-800/30 via-slate-700/20 to-slate-800/30
        border-slate-600/20 shadow-[0_8px_32px_rgba(31,38,135,0.37)] ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h3
            className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-blue-400 
            bg-clip-text text-transparent"
          >
            Performance Trend
          </h3>
          <div className="flex items-center space-x-3 mt-2">
            <div
              className={`flex items-center space-x-1 ${
                trend === "up" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {trend === "up" ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-semibold">
                {formatPercentage(currentAPR, false, 1)} APR
              </span>
            </div>
            <span className="text-sm text-slate-400">{interpretationText}</span>
          </div>
          {isFiltered && (
            <div className="text-xs text-amber-400 mt-1">
              Showing filtered portfolio • Full portfolio comparison in
              background
            </div>
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="flex space-x-2">
          {TIMEFRAME_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedTimeframe(option.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 
                ${
                  selectedTimeframe === option.value
                    ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-32 sm:h-40">
        <svg
          viewBox="0 0 800 120"
          className="w-full h-full cursor-crosshair"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="aprGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="ghostGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748b" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[...Array(4)].map((_, i) => (
            <line
              key={i}
              x1="0"
              y1={20 + i * 20}
              x2="800"
              y2={20 + i * 20}
              stroke="#334155"
              strokeWidth="0.5"
              strokeDasharray="2,4"
              opacity="0.3"
            />
          ))}

          {/* Ghost line for full portfolio when filtered */}
          {isFiltered && fullPortfolioData && (
            <>
              <path
                d={generateAPRAreaPath(fullPortfolioData)}
                fill="url(#ghostGradient)"
                fillOpacity={0.3}
              />
              <path
                d={generateAPRSVGPath(fullPortfolioData)}
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="3 3"
                fill="none"
                opacity={0.6}
              />
            </>
          )}

          {/* Main performance area */}
          <path
            d={generateAPRAreaPath(chartData)}
            fill="url(#aprGradient)"
            fillOpacity={1}
          />

          {/* Main performance line */}
          <path
            d={generateAPRSVGPath(chartData)}
            stroke="#10b981"
            strokeWidth={2}
            fill="none"
            className="drop-shadow-sm"
          />

          {/* Hover indicator */}
          {hoveredPoint && (
            <g>
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="4"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
                className="drop-shadow-lg"
              />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className={`absolute bg-slate-800/95 backdrop-blur-sm rounded-lg p-3 border border-slate-600/50 shadow-xl pointer-events-none ${Z_INDEX.CONTENT}`}
            style={{
              left: Math.min(hoveredPoint.x, 700), // Keep tooltip in view
              top: Math.max(hoveredPoint.y - 60, 10),
            }}
          >
            <p className="text-slate-300 text-sm">{hoveredPoint.date}</p>
            <p className="text-emerald-400 font-semibold">
              {formatPercentage(hoveredPoint.apr, false, 1)} APR
            </p>
            {isFiltered && (
              <p className="text-slate-500 text-xs mt-1">Filtered Portfolio</p>
            )}
          </div>
        )}
      </div>

      {/* Mobile-specific additional info */}
      <div className="sm:hidden mt-4 pt-4 border-t border-slate-600/20">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Period:</span>
          <span className="text-white font-medium">
            {TIMEFRAME_OPTIONS.find(t => t.value === selectedTimeframe)?.label}
          </span>
        </div>
        {isFiltered && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-slate-400">View:</span>
            <span className="text-amber-400 font-medium">
              Filtered Portfolio
            </span>
          </div>
        )}
      </div>
    </BaseCard>
  );
}

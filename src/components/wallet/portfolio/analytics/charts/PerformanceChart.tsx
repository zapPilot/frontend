/**
 * Performance Chart Component
 *
 * Shows portfolio vs benchmark performance over time
 */

import { memo, useMemo } from "react";

import { ChartIndicator, ChartTooltip } from "@/components/charts";
import { useChartHover } from "@/hooks/useChartHover";
import type { PerformanceHoverData } from "@/types/ui/chartHover";
import { formatChartDate } from "@/utils/formatters";

import { buildPath, CHART_GRID_POSITIONS } from "../utils/chartHelpers";
import { ChartGridLines, ChartSurface } from "./ChartUI";

/**
 * Performance chart data point
 */
interface PerformanceChartDataPoint {
  x: number;
  portfolio: number;
  btc: number | null; // Allow null for missing BTC data
  date: string;
  portfolioValue: number;
  btcBenchmarkValue: number | null; // Actual BTC equivalent value in USD, null if unavailable
}

/**
 * Performance Chart Props
 */
interface PerformanceChartProps {
  chartData: PerformanceChartDataPoint[];
  startDate: string;
  endDate: string;
  width?: number;
  height?: number;
}

/**
 * Net Worth Performance Chart
 *
 * Displays portfolio value vs BTC benchmark over time with:
 * - Purple filled area for portfolio
 * - Orange dashed line for BTC benchmark
 * - Interactive hover tooltips
 * - Regime overlay (visual indicator)
 */
export const PerformanceChart = memo<PerformanceChartProps>(
  ({ chartData, startDate, endDate, width = 800, height = 300 }) => {
    const data = chartData;

    const { minValue, maxValue } = useMemo(() => {
      if (data.length === 0) {
        return { minValue: 0, maxValue: 0 };
      }

      const initialValue = data[0]?.portfolioValue ?? 0;

      return data.reduce(
        (range, point) => ({
          minValue: Math.min(range.minValue, point.portfolioValue),
          maxValue: Math.max(range.maxValue, point.portfolioValue),
        }),
        {
          minValue: initialValue,
          maxValue: initialValue,
        }
      );
    }, [data]);

    // Chart hover with tooltip
    const performanceHover = useChartHover(data, {
      chartType: "performance",
      chartWidth: width,
      chartHeight: height,
      chartPadding: 0,
      minValue,
      maxValue,
      getYValue: point => point.portfolioValue,
      buildHoverData: (point, x, y): PerformanceHoverData => ({
        chartType: "performance",
        x,
        y,
        date: formatChartDate(point.date),
        value: point.portfolioValue,
        benchmark: point.btcBenchmarkValue ?? undefined, // Convert null to undefined for tooltip
      }),
    });

    // Build SVG paths - convert normalized 0-100 coords to pixel coords
    const portfolioPath = buildPath(
      data,
      width,
      point => (point.portfolio / 100) * height
    );

    // Filter out null BTC values before building path
    const btcPath = useMemo(() => {
      // Filter to points with valid BTC data and narrow the type
      const validPoints = data.filter(
        (point): point is PerformanceChartDataPoint & { btc: number } =>
          point.btc !== null
      );
      if (validPoints.length === 0) return null;

      return buildPath(validPoints, width, point => (point.btc / 100) * height);
    }, [data, width, height]);

    return (
      <div className="relative w-full h-64 overflow-hidden rounded-xl bg-gray-900/30 border border-gray-800 cursor-pointer hover:bg-gray-900/40 hover:border-gray-700/80 transition-all duration-200 group">
        {/* Grid Lines */}
        <ChartGridLines positions={CHART_GRID_POSITIONS.FIVE_LINES} />

        <ChartSurface width={width} height={height} handlers={performanceHover}>
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

          {/* BTC Benchmark Line (dashed) - only render if data available */}
          {btcPath && (
            <path
              d={`M ${btcPath}`}
              fill="none"
              stroke="#F7931A"
              strokeWidth="1"
              strokeDasharray="4 2"
              vectorEffect="non-scaling-stroke"
              opacity="0.6"
            />
          )}

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={performanceHover.hoveredPoint} />
        </ChartSurface>

        {/* Regime Overlay */}
        <div className="absolute inset-0 flex pointer-events-none opacity-5">
          <div className="w-[30%] h-full bg-red-500" />
          <div className="w-[40%] h-full bg-yellow-500" />
          <div className="w-[30%] h-full bg-green-500" />
        </div>

        {/* Legend */}
        <div className="absolute top-3 right-3 flex gap-4 text-[10px]">
          <div className="flex items-center gap-1 pointer-events-none">
            <div className="w-3 h-0.5 bg-purple-500 rounded" />
            <span className="text-gray-400">Portfolio</span>
          </div>
          <div
            className="flex items-center gap-1 group pointer-events-auto cursor-help"
            title="Shows what your initial portfolio value would be worth if invested 100% in Bitcoin. Example: $10,000 portfolio when BTC was $50,000, now BTC is $60,000 → benchmark value is $12,000"
          >
            <div className="w-3 h-0.5 bg-orange-500 rounded opacity-60" />
            <span className="text-gray-400 group-hover:text-orange-400 transition-colors">
              BTC Benchmark
            </span>
          </div>
        </div>

        {/* Time Labels */}
        <div className="absolute bottom-2 left-4 text-xs text-gray-500 font-mono">
          {formatChartDate(startDate)}
        </div>
        <div className="absolute bottom-2 right-4 text-xs text-gray-500 font-mono">
          {formatChartDate(endDate)}
        </div>

        {/* Tooltip */}
        <ChartTooltip
          hoveredPoint={performanceHover.hoveredPoint}
          chartWidth={width}
          chartHeight={height}
        />
      </div>
    );
  }
);

PerformanceChart.displayName = "PerformanceChart";

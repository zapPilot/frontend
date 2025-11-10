"use client";

import { memo, useCallback, useMemo } from "react";

import { useChartHover } from "../../../hooks/useChartHover";
import { formatCurrency } from "../../../lib/formatters";
import { ChartIndicator, ChartTooltip } from "../../charts";
import { CHART_DIMENSIONS } from "../chartConstants";
import type { DailyYieldOverridePoint } from "../types";
import {
  CHART_LABELS,
  ENABLE_TEST_AUTO_HOVER,
  getChartInteractionProps,
} from "../utils";
import { ChartGrid } from "./ChartGrid";
import { buildLinePath } from "./pathBuilders";

interface DailyYieldChartProps {
  data: DailyYieldOverridePoint[];
  width?: number;
  height?: number;
  padding?: number;
}

/**
 * DailyYieldChart - Daily yield returns visualization
 *
 * Displays daily yield returns as bars with positive/negative coloring
 * and a cumulative yield line overlay showing running total.
 *
 * Features:
 * - Green bars for positive yields
 * - Red bars for negative yields
 * - Purple cumulative line overlay
 * - Zero baseline with dashed line
 * - Per-protocol breakdown in tooltip
 */
export const DailyYieldChart = memo<DailyYieldChartProps>(
  ({
    data,
    width = CHART_DIMENSIONS.WIDTH,
    height = CHART_DIMENSIONS.HEIGHT,
    padding = CHART_DIMENSIONS.PADDING,
  }) => {
    // Calculate min/max for Y-axis (include zero)
    const { minDailyYield, maxDailyYield, maxCumulativeYield } = useMemo(() => {
      const dailyValues = data.map(d => d.total_yield_usd);
      const cumulativeValues = data.map(d => d.cumulative_yield_usd ?? 0);

      return {
        minDailyYield: Math.min(0, ...dailyValues),
        maxDailyYield: Math.max(0, ...dailyValues),
        maxCumulativeYield: Math.max(...cumulativeValues, 0),
      };
    }, [data]);

    // Calculate Y-axis range (combine daily and cumulative)
    const minValue = minDailyYield;
    const maxValue = Math.max(maxDailyYield, maxCumulativeYield);
    const valueRange = maxValue - minValue;

    // Y coordinate converter
    const toY = useCallback(
      (value: number) => {
        if (valueRange === 0) return padding + (height - 2 * padding) / 2;
        return (
          padding +
          (height - 2 * padding) * (1 - (value - minValue) / valueRange)
        );
      },
      [valueRange, padding, height, minValue]
    );

    // Zero baseline Y position
    const zeroY = toY(0);

    // Bar rendering
    const bars = useMemo(() => {
      if (data.length === 0) return [];

      const chartWidth = width - 2 * padding;
      const barWidth = chartWidth / data.length;
      const barPadding = barWidth * 0.1; // 10% padding between bars

      return data.map((point, idx) => {
        const x = padding + idx * barWidth;
        const yieldValue = point.total_yield_usd;
        const isPositive = yieldValue >= 0;

        const barHeight = Math.abs(toY(yieldValue) - zeroY);
        const barY = isPositive ? toY(yieldValue) : zeroY;

        return {
          x: x + barPadding / 2,
          y: barY,
          width: barWidth - barPadding,
          height: barHeight,
          fill: isPositive ? "#10b981" : "#ef4444", // Green for positive, red for negative
          point,
        };
      });
    }, [data, width, padding, zeroY, toY]);

    // Cumulative line path
    const cumulativePath = useMemo(
      () =>
        buildLinePath({
          data,
          width,
          getY: point => toY(point.cumulative_yield_usd ?? 0),
        }),
      [data, width, toY]
    );

    // Daily yield hover with protocol breakdown
    const yieldHover = useChartHover(data, {
      chartType: "daily-yield",
      chartWidth: width,
      chartHeight: height,
      chartPadding: padding,
      minValue,
      maxValue,
      getYValue: point => point.total_yield_usd,
      buildHoverData: (point, x, y) => ({
        chartType: "daily-yield" as const,
        x,
        y,
        date: new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        totalYield: point.total_yield_usd,
        cumulativeYield: point.cumulative_yield_usd ?? 0,
        isPositive: point.total_yield_usd >= 0,
        protocolCount: point.protocol_count ?? 0,
        protocols: point.protocols ?? [],
      }),
      testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
    });

    return (
      <div className="relative h-80">
        <ChartGrid />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          data-chart-type="daily-yield"
          aria-label={CHART_LABELS["daily-yield"] ?? "Daily yield returns"}
          {...getChartInteractionProps(yieldHover)}
        >
          <text x="16" y="20" opacity="0">
            Daily yield returns with cumulative total
          </text>

          <defs>
            <linearGradient
              id="cumulativeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Zero baseline */}
          <line
            x1={padding}
            y1={zeroY}
            x2={width - padding}
            y2={zeroY}
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.5"
          />

          {/* Bars */}
          {bars.map((bar, idx) => (
            <rect
              key={idx}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.fill}
              opacity={0.8}
            />
          ))}

          {/* Cumulative line */}
          {cumulativePath && (
            <path
              d={cumulativePath}
              fill="none"
              stroke="url(#cumulativeGradient)"
              strokeWidth="2.5"
              className="drop-shadow-lg"
            />
          )}

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={yieldHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          <span>{formatCurrency(maxValue)}</span>
          <span>{formatCurrency(maxValue * 0.75)}</span>
          <span>{formatCurrency(maxValue * 0.5)}</span>
          <span>{formatCurrency(maxValue * 0.25)}</span>
          <span>{formatCurrency(0)}</span>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 text-xs pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
            <span className="text-white">Positive Yield</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-white">Negative Yield</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <span className="text-white">Cumulative</span>
          </div>
        </div>

        <ChartTooltip
          hoveredPoint={yieldHover.hoveredPoint}
          chartWidth={width}
          chartHeight={height}
        />
      </div>
    );
  }
);

DailyYieldChart.displayName = "DailyYieldChart";

"use client";

import { memo, useCallback, useMemo } from "react";

import { formatCurrency } from "../../../lib/formatters";
import { ChartIndicator, ChartTooltip } from "../../charts";
import { CHART_DIMENSIONS } from "../chartConstants";
import { useStandardChartHover } from "../hooks/useStandardChartHover";
import type { DailyYieldOverridePoint } from "../types";
import { CHART_LABELS, getChartInteractionProps } from "../utils";
import { ChartGrid } from "./ChartGrid";
import { ChartReferenceLine } from "./ChartReferenceLine";
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
 * Displays daily yield returns as flowing stacked areas with positive/negative
 * coloring and a bold cumulative yield line overlay showing running total.
 *
 * Features:
 * - Green area for positive yields (gradient)
 * - Red area for negative yields (gradient)
 * - Bold purple-pink cumulative line overlay
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

    // Build area paths for positive and negative yields
    const { positiveAreaPath, negativeAreaPath } = useMemo(() => {
      if (data.length === 0)
        return { positiveAreaPath: "", negativeAreaPath: "" };

      const chartWidth = width - 2 * padding;
      const pointSpacing = chartWidth / (data.length - 1);

      let positivePath = "";
      let negativePath = "";

      // Build positive area (above zero)
      const positivePoints = data.map((point, idx) => {
        const x = padding + idx * pointSpacing;
        const yieldValue = Math.max(0, point.total_yield_usd);
        const y = toY(yieldValue);
        return { x, y };
      });

      if (positivePoints.length > 0) {
        positivePath = `M ${padding},${zeroY} `;
        for (const { x, y } of positivePoints) {
          positivePath += `L ${x},${y} `;
        }
        const lastPoint = positivePoints[positivePoints.length - 1];
        if (lastPoint) {
          positivePath += `L ${lastPoint.x},${zeroY} Z`;
        }
      }

      // Build negative area (below zero)
      const negativePoints = data.map((point, idx) => {
        const x = padding + idx * pointSpacing;
        const yieldValue = Math.min(0, point.total_yield_usd);
        const y = toY(yieldValue);
        return { x, y };
      });

      if (negativePoints.length > 0) {
        negativePath = `M ${padding},${zeroY} `;
        for (const { x, y } of negativePoints) {
          negativePath += `L ${x},${y} `;
        }
        const lastPoint = negativePoints[negativePoints.length - 1];
        if (lastPoint) {
          negativePath += `L ${lastPoint.x},${zeroY} Z`;
        }
      }

      return { positiveAreaPath: positivePath, negativeAreaPath: negativePath };
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
    const yieldHover = useStandardChartHover(data, {
      chartType: "daily-yield",
      chartWidth: width,
      chartHeight: height,
      chartPadding: padding,
      minValue,
      maxValue,
      getYValue: point => point.total_yield_usd,
      buildChartSpecificData: point => ({
        totalYield: point.total_yield_usd,
        cumulativeYield: point.cumulative_yield_usd ?? 0,
        isPositive: point.total_yield_usd >= 0,
        protocolCount: point.protocol_count ?? 0,
        protocols: point.protocols ?? [],
      }),
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
            <linearGradient
              id="positiveAreaGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient
              id="negativeAreaGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Zero baseline */}
          <ChartReferenceLine y={zeroY} x1={padding} x2={width - padding} />

          {/* Positive area (green gradient) */}
          {positiveAreaPath && (
            <path
              d={positiveAreaPath}
              fill="url(#positiveAreaGradient)"
              stroke="none"
            />
          )}

          {/* Negative area (red gradient) */}
          {negativeAreaPath && (
            <path
              d={negativeAreaPath}
              fill="url(#negativeAreaGradient)"
              stroke="none"
            />
          )}

          {/* Bold cumulative line with enhanced drop shadow */}
          {cumulativePath && (
            <path
              d={cumulativePath}
              fill="none"
              stroke="url(#cumulativeGradient)"
              strokeWidth="4"
              className="drop-shadow-2xl"
              style={{
                filter: "drop-shadow(0 4px 8px rgba(168, 85, 247, 0.6))",
              }}
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
            <div className="w-4 h-3 bg-gradient-to-b from-emerald-500/40 to-emerald-500/10"></div>
            <span className="text-white">Positive Flow</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-3 bg-gradient-to-b from-red-500/10 to-red-500/40"></div>
            <span className="text-white">Negative Flow</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/50"></div>
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

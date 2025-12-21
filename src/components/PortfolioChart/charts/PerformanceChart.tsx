"use client";

import { memo, useMemo } from "react";

import {
  formatAxisLabel,
  generateSVGPath,
  generateYAxisLabels,
} from "../../../utils/chartUtils";
import { ChartIndicator, ChartTooltip } from "../../charts";
import { CHART_DIMENSIONS } from "../chartConstants";
import { useStandardChartHover } from "../hooks/useStandardChartHover";
import type { PortfolioStackedDataPoint } from "../types";
import {
  CHART_LABELS,
  getChartInteractionProps,
  getStackedTotalValue,
} from "../utils";
import { ChartGrid } from "./ChartGrid";

interface PerformanceChartProps {
  data: PortfolioStackedDataPoint[];
  selectedPeriod: string;
  width?: number;
  height?: number;
  padding?: number;
}

/**
 * PerformanceChart - Portfolio value over time visualization
 *
 * Displays total portfolio performance as a clean line chart.
 * Shows aggregate portfolio value with detailed breakdown on hover.
 *
 * Features:
 * - Single line showing total portfolio value (purple)
 * - Interactive hover with detailed tooltips
 * - Breakdown showing DeFi and Wallet values with percentages
 * - Smooth line rendering with drop shadow
 */
export const PerformanceChart = memo<PerformanceChartProps>(
  ({
    data,
    selectedPeriod,
    width = CHART_DIMENSIONS.WIDTH,
    height = CHART_DIMENSIONS.HEIGHT,
    padding = CHART_DIMENSIONS.PADDING,
  }) => {
    // Calculate min/max values for Y-axis scaling
    const { minValue, maxValue } = useMemo(() => {
      const stackedTotals = data
        .map(getStackedTotalValue)
        .filter(value => Number.isFinite(value));

      if (stackedTotals.length > 0) {
        return {
          minValue: Math.min(...stackedTotals),
          maxValue: Math.max(...stackedTotals),
        };
      }

      return { minValue: 0, maxValue: 0 };
    }, [data]);

    // Generate single line path for total portfolio value
    const linePath = useMemo(() => {
      if (data.length === 0) return "";

      return generateSVGPath(
        data,
        p => getStackedTotalValue(p as PortfolioStackedDataPoint),
        width,
        height,
        padding
      );
    }, [data, width, height, padding]);

    // Performance chart hover
    const performanceHover = useStandardChartHover(data, {
      chartType: "performance",
      chartWidth: width,
      chartHeight: height,
      chartPadding: padding,
      minValue,
      maxValue,
      getYValue: point => getStackedTotalValue(point),
      buildChartSpecificData: point => ({
        value: getStackedTotalValue(point),
        benchmark: point.benchmark || 0,
        defiValue: point.defiValue,
        walletValue: point.walletValue,
      }),
    });

    return (
      <div className="relative h-80">
        <ChartGrid />

        {/* Chart area */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          data-chart-type="performance"
          aria-label={CHART_LABELS.performance}
          {...getChartInteractionProps(performanceHover)}
        >
          <text x="16" y="20" opacity="0">
            Portfolio performance data over the selected period {selectedPeriod}
          </text>

          {/* Single portfolio value line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#c4b5fd"
              strokeWidth="2.5"
              className="drop-shadow-lg"
            />
          )}

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={performanceHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          {generateYAxisLabels(minValue, maxValue, 3).map((value, index) => (
            <span key={index}>{formatAxisLabel(value)}</span>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 flex items-center space-x-3 text-xs pointer-events-none">
          <div className="flex items-center space-x-1.5">
            <div
              className="w-4 h-0.5 rounded-sm"
              style={{
                backgroundColor: "#c4b5fd",
              }}
            ></div>
            <span className="text-white">Portfolio Value</span>
          </div>
        </div>

        {/* Hover Tooltip */}
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

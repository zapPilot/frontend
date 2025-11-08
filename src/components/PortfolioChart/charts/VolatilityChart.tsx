"use client";

import { memo, useMemo } from "react";

import { useChartHover } from "../../../hooks/useChartHover";
import { getVolatilityRiskLevel } from "../../../lib/chartHoverUtils";
import { ChartIndicator, ChartTooltip } from "../../charts";
import { CHART_DIMENSIONS, VOLATILITY_CONSTANTS } from "../chartConstants";
import {
  CHART_LABELS,
  ENABLE_TEST_AUTO_HOVER,
  getChartInteractionProps,
} from "../utils";
import { ChartGrid } from "./ChartGrid";
import { buildAreaPath, buildLinePath } from "./pathBuilders";
import { ChartHelpModal } from "../components";

interface VolatilityChartProps {
  data: { date: string; volatility: number }[];
  width?: number;
  height?: number;
  padding?: number;
}

/**
 * VolatilityChart - Portfolio risk level visualization
 *
 * Displays rolling volatility (30-day annualized) as a percentage over time.
 * Shows portfolio stability and risk levels through color-coded zones.
 *
 * Features:
 * - Amber gradient area chart (risk indicator)
 * - Y-axis scale 10-40% (typical DeFi volatility range)
 * - Risk level interpretation (low/medium/high)
 * - Percentage-based display
 */
export const VolatilityChart = memo<VolatilityChartProps>(
  ({
    data,
    width = CHART_DIMENSIONS.WIDTH,
    height = CHART_DIMENSIONS.HEIGHT,
    padding = CHART_DIMENSIONS.PADDING,
  }) => {
    // Volatility chart hover with risk levels
    const volatilityHover = useChartHover(data, {
      chartType: "volatility",
      chartWidth: width,
      chartHeight: height,
      chartPadding: padding,
      minValue: VOLATILITY_CONSTANTS.MIN_VALUE,
      maxValue: VOLATILITY_CONSTANTS.MAX_VALUE,
      getYValue: point => point.volatility,
      buildHoverData: (point, x, y) => {
        const vol = point.volatility ?? 0;

        return {
          chartType: "volatility" as const,
          x,
          y,
          date: new Date(point.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          volatility: vol,
          riskLevel: getVolatilityRiskLevel(vol),
        };
      },
      testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
    });

    const toVolatilityY = (value: number) =>
      250 -
      ((value - VOLATILITY_CONSTANTS.MIN_VALUE) /
        (VOLATILITY_CONSTANTS.MAX_VALUE - VOLATILITY_CONSTANTS.MIN_VALUE)) *
        200;

    const volatilityLinePath = useMemo(
      () =>
        buildLinePath({
          data,
          width,
          getY: point => toVolatilityY(point.volatility ?? 0),
        }),
      [data, width]
    );

    const volatilityAreaPath = useMemo(
      () =>
        buildAreaPath({
          data,
          width,
          baseY: 250,
          getY: point => toVolatilityY(point.volatility ?? 0),
        }),
      [data, width]
    );

    return (
      <div className="relative h-80">
        <ChartGrid />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          data-chart-type="volatility"
          aria-label={CHART_LABELS.volatility}
          {...getChartInteractionProps(volatilityHover)}
        >
          <text x="16" y="20" opacity="0">
            Rolling volatility expressed as annualized percentage
          </text>
          <defs>
            <linearGradient
              id="volatilityGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Volatility line */}
          {volatilityLinePath && (
            <path
              d={volatilityLinePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              className="drop-shadow-lg"
            />
          )}

          {/* Fill area under curve */}
          {volatilityAreaPath && (
            <path d={volatilityAreaPath} fill="url(#volatilityGradient)" />
          )}

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={volatilityHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels - DeFi-adjusted range (5-100%) */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>5%</span>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 text-xs pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-amber-500"></div>
            <span className="text-white">30-Day Volatility</span>
          </div>
        </div>

        {/* Hover Tooltip */}
        <ChartTooltip
          hoveredPoint={volatilityHover.hoveredPoint}
          chartWidth={width}
          chartHeight={height}
        />
      </div>
    );
  }
);

VolatilityChart.displayName = "VolatilityChart";

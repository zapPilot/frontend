"use client";

import { memo } from "react";
import { useChartHover } from "../../../hooks/useChartHover";
import { ChartIndicator, ChartTooltip } from "../../charts";
import { CHART_DIMENSIONS, VOLATILITY_CONSTANTS } from "../chartConstants";
import { getVolatilityRiskLevel } from "../../../lib/chartHoverUtils";
import {
  getChartInteractionProps,
  CHART_LABELS,
  ENABLE_TEST_AUTO_HOVER,
} from "../utils";

interface VolatilityChartProps {
  data: Array<{ date: string; volatility: number }>;
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

    return (
      <div className="relative h-80">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-gray-700/60" />
          ))}
        </div>

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
          <path
            d={`M ${data
              .map((point, index) => {
                const x = (index / (data.length - 1)) * width;
                const y =
                  250 -
                  ((point.volatility - VOLATILITY_CONSTANTS.MIN_VALUE) /
                    (VOLATILITY_CONSTANTS.MAX_VALUE -
                      VOLATILITY_CONSTANTS.MIN_VALUE)) *
                    200;
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(" ")}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            className="drop-shadow-lg"
          />

          {/* Fill area under curve */}
          <path
            d={`M 0 250 ${data
              .map((point, index) => {
                const x = (index / (data.length - 1)) * width;
                const y =
                  250 -
                  ((point.volatility - VOLATILITY_CONSTANTS.MIN_VALUE) /
                    (VOLATILITY_CONSTANTS.MAX_VALUE -
                      VOLATILITY_CONSTANTS.MIN_VALUE)) *
                    200;
                return `L ${x} ${y}`;
              })
              .join(" ")} L ${width} 250 Z`}
            fill="url(#volatilityGradient)"
          />

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={volatilityHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          <span>40%</span>
          <span>32%</span>
          <span>25%</span>
          <span>18%</span>
          <span>10%</span>
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

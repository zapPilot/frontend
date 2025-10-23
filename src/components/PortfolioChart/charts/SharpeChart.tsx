"use client";

import { memo } from "react";
import { useChartHover } from "../../../hooks/useChartHover";
import { ChartIndicator, ChartTooltip } from "../../charts";
import { CHART_DIMENSIONS, SHARPE_CONSTANTS } from "../chartConstants";
import { getSharpeInterpretation } from "../../../lib/chartHoverUtils";
import {
  getChartInteractionProps,
  CHART_LABELS,
  ENABLE_TEST_AUTO_HOVER,
} from "../utils";

interface SharpeChartProps {
  data: Array<{ date: string; sharpe: number }>;
  width?: number;
  height?: number;
  padding?: number;
}

/**
 * SharpeChart - Risk-adjusted return visualization
 *
 * Displays rolling Sharpe ratio over time with 5-level interpretation system.
 * Shows relationship between returns and volatility to assess portfolio efficiency.
 *
 * Features:
 * - Green gradient area under curve
 * - Reference line at Sharpe = 1.0 (good performance threshold)
 * - 5-level interpretation (excellent/good/fair/poor/negative)
 * - Y-axis scale 0-2.5 for typical Sharpe ranges
 */
export const SharpeChart = memo<SharpeChartProps>(
  ({
    data,
    width = CHART_DIMENSIONS.WIDTH,
    height = CHART_DIMENSIONS.HEIGHT,
    padding = CHART_DIMENSIONS.PADDING,
  }) => {
    // Sharpe chart hover (5-level system)
    const sharpeHover = useChartHover(data, {
      chartType: "sharpe",
      chartWidth: width,
      chartHeight: height,
      chartPadding: padding,
      minValue: SHARPE_CONSTANTS.MIN_VALUE,
      maxValue: SHARPE_CONSTANTS.MAX_VALUE,
      getYValue: point => point.sharpe,
      buildHoverData: (point, x, y) => {
        const sharpe = point.sharpe ?? 0;

        return {
          chartType: "sharpe" as const,
          x,
          y,
          date: new Date(point.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          sharpe,
          interpretation: getSharpeInterpretation(sharpe),
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
          data-chart-type="sharpe"
          aria-label={CHART_LABELS.sharpe}
          {...getChartInteractionProps(sharpeHover)}
        >
          <text x="16" y="20" opacity="0">
            Rolling Sharpe ratio trend for the portfolio
          </text>
          <defs>
            <linearGradient
              id="sharpeGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Sharpe ratio line */}
          <path
            d={`M ${data
              .map((point, index) => {
                const x = (index / (data.length - 1)) * width;
                const y =
                  250 - (point.sharpe / SHARPE_CONSTANTS.MAX_VALUE) * 200; // Scale 0-2.5
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(" ")}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            className="drop-shadow-lg"
          />

          {/* Fill area under curve */}
          <path
            d={`M 0 250 ${data
              .map((point, index) => {
                const x = (index / (data.length - 1)) * width;
                const y =
                  250 - (point.sharpe / SHARPE_CONSTANTS.MAX_VALUE) * 200;
                return `L ${x} ${y}`;
              })
              .join(" ")} L ${width} 250 Z`}
            fill="url(#sharpeGradient)"
          />

          {/* Reference line at Sharpe = 1.0 */}
          <line
            x1="0"
            y1={
              250 -
              (SHARPE_CONSTANTS.GOOD_THRESHOLD / SHARPE_CONSTANTS.MAX_VALUE) *
                200
            }
            x2={width}
            y2={
              250 -
              (SHARPE_CONSTANTS.GOOD_THRESHOLD / SHARPE_CONSTANTS.MAX_VALUE) *
                200
            }
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.5"
          />

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={sharpeHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          <span>2.5</span>
          <span>2.0</span>
          <span>1.5</span>
          <span>1.0</span>
          <span>0.5</span>
          <span>0.0</span>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 text-xs pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-emerald-500"></div>
            <span className="text-white">Rolling Sharpe Ratio</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <div
              className="w-3 h-0.5 bg-gray-500 opacity-50"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, #6b7280, #6b7280 2px, transparent 2px, transparent 4px)",
              }}
            ></div>
            <span className="text-gray-400">Sharpe = 1.0</span>
          </div>
        </div>

        {/* Hover Tooltip */}
        <ChartTooltip
          hoveredPoint={sharpeHover.hoveredPoint}
          chartWidth={width}
          chartHeight={height}
        />
      </div>
    );
  }
);

SharpeChart.displayName = "SharpeChart";

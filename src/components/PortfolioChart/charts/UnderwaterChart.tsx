"use client";

import { memo } from "react";

import { useChartHover } from "../../../hooks/useChartHover";
import { getRecoveryStatus } from "../../../lib/chartHoverUtils";
import { ChartIndicator, ChartTooltip } from "../../charts";
import { CHART_DIMENSIONS, UNDERWATER_CONSTANTS } from "../chartConstants";
import {
  CHART_LABELS,
  ENABLE_TEST_AUTO_HOVER,
  getChartInteractionProps,
} from "../utils";

interface UnderwaterChartProps {
  data: { date: string; underwater: number; recovery?: boolean }[];
  width?: number;
  height?: number;
  padding?: number;
}

/**
 * UnderwaterChart - Recovery status visualization
 *
 * Displays time spent below peak value (underwater) and recovery points.
 * Shows how long portfolio remains below previous highs and when recovery occurs.
 *
 * Features:
 * - Cyan area chart for underwater periods
 * - Green recovery point indicators at zero line
 * - Vertical dotted lines connecting recovery points to curve
 * - Recovery status in tooltip (underwater/recovering/at peak)
 */
export const UnderwaterChart = memo<UnderwaterChartProps>(
  ({
    data,
    width = CHART_DIMENSIONS.WIDTH,
    height = CHART_DIMENSIONS.HEIGHT,
    padding = CHART_DIMENSIONS.PADDING,
  }) => {
    // Underwater chart hover
    const underwaterHover = useChartHover(data, {
      chartType: "underwater",
      chartWidth: width,
      chartHeight: height,
      chartPadding: padding,
      minValue: UNDERWATER_CONSTANTS.MIN_VALUE,
      maxValue: UNDERWATER_CONSTANTS.MAX_VALUE,
      getYValue: point => point.underwater,
      buildHoverData: (point, x, y) => {
        const isRecovery = point.recovery ?? false;

        return {
          chartType: "underwater" as const,
          x,
          y,
          date: new Date(point.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          underwater: point.underwater,
          isRecoveryPoint: isRecovery,
          recoveryStatus: getRecoveryStatus(point.underwater),
        };
      },
      testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
    });

    return (
      <div className="relative h-80">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          data-chart-type="underwater"
          aria-label={CHART_LABELS.underwater}
          {...getChartInteractionProps(underwaterHover)}
        >
          <text x="16" y="20" opacity="0">
            Underwater recovery status relative to peak values
          </text>
          <defs>
            <linearGradient
              id="underwaterGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient
              id="recoveryGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Zero line */}
          <line
            x1="0"
            y1="50"
            x2={width}
            y2="50"
            stroke="#374151"
            strokeWidth="2"
            strokeDasharray="4,4"
          />

          {/* Underwater area */}
          <path
            d={`M 0 50 ${data
              .map((point, index) => {
                const x = (index / (data.length - 1)) * width;
                const y =
                  50 +
                  (point.underwater / UNDERWATER_CONSTANTS.MIN_VALUE) * 250; // Scale to -20% max
                return `L ${x} ${y}`;
              })
              .join(" ")} L ${width} 50 Z`}
            fill="url(#underwaterGradient)"
          />

          {/* Underwater line */}
          <path
            d={`M ${data
              .map((point, index) => {
                const x = (index / (data.length - 1)) * width;
                const y =
                  50 +
                  (point.underwater / UNDERWATER_CONSTANTS.MIN_VALUE) * 250;
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              })
              .join(" ")}`}
            fill="none"
            stroke="#0891b2"
            strokeWidth="2.5"
          />

          {/* Recovery indicators */}
          {data.map((point, index) => {
            if (!point.recovery) return null;
            const x = (index / (data.length - 1)) * width;
            const y =
              50 + (point.underwater / UNDERWATER_CONSTANTS.MIN_VALUE) * 250;
            return (
              <g key={index}>
                {/* Vertical recovery line from zero to curve */}
                <line
                  x1={x}
                  y1="50"
                  x2={x}
                  y2={y}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  opacity="0.6"
                />
                {/* Recovery point circle at zero line */}
                <circle cx={x} cy="50" r="5" fill="#10b981" opacity="0.8" />
              </g>
            );
          })}

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={underwaterHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          <span>0%</span>
          <span>-5%</span>
          <span>-10%</span>
          <span>-15%</span>
          <span>-20%</span>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 space-y-1 text-xs pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-cyan-600"></div>
            <span className="text-white">Underwater Periods</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-400">Recovery Points</span>
          </div>
        </div>

        {/* Hover Tooltip */}
        <ChartTooltip
          hoveredPoint={underwaterHover.hoveredPoint}
          chartWidth={width}
          chartHeight={height}
        />
      </div>
    );
  }
);

UnderwaterChart.displayName = "UnderwaterChart";

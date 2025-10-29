"use client";

import { memo, useMemo, useCallback } from "react";
import { useChartHover } from "../../../hooks/useChartHover";
import { ChartIndicator, ChartTooltip } from "../../charts";
import { CHART_DIMENSIONS, DRAWDOWN_CONSTANTS } from "../chartConstants";
import {
  calculateDrawdownY,
  calculateDrawdownScaleDenominator,
  calculateDrawdownMinValue,
} from "../chartHelpers";
import {
  calculateDaysSincePeak,
  findPeakDate,
} from "../../../lib/chartHoverUtils";
import {
  getChartInteractionProps,
  CHART_LABELS,
  ENABLE_TEST_AUTO_HOVER,
} from "../utils";

interface DrawdownChartProps {
  data: Array<{ date: string; drawdown: number }>;
  referenceData: Array<{ date: string; portfolio_value: number }>;
  width?: number;
  height?: number;
}

/**
 * DrawdownChart - Peak-to-trough decline visualization
 *
 * Displays portfolio drawdown as negative percentage values from peak.
 * Uses red area chart to emphasize losses and recovery periods.
 *
 * Features:
 * - Negative value area chart (orange/red)
 * - Zero baseline reference line
 * - Peak distance calculations in tooltip
 * - Automatic Y-axis scaling (rounded to -5% increments)
 */
export const DrawdownChart = memo<DrawdownChartProps>(
  ({
    data,
    referenceData,
    width = CHART_DIMENSIONS.WIDTH,
    height = CHART_DIMENSIONS.HEIGHT,
  }) => {
    const drawdownMinValue = useMemo(
      () => calculateDrawdownMinValue(data.map(point => point.drawdown ?? 0)),
      [data]
    );

    const drawdownScaleDenominator = useMemo(
      () => calculateDrawdownScaleDenominator(drawdownMinValue),
      [drawdownMinValue]
    );

    const getDrawdownY = useCallback(
      (value: number) => calculateDrawdownY(value, drawdownScaleDenominator),
      [drawdownScaleDenominator]
    );

    const drawdownZeroLineY = useMemo(
      () => getDrawdownY(DRAWDOWN_CONSTANTS.DEFAULT_MAX),
      [getDrawdownY]
    );

    const drawdownLinePath = useMemo(() => {
      if (data.length === 0) {
        return "";
      }

      return data
        .map((point, index) => {
          const x =
            data.length <= 1 ? width / 2 : (index / (data.length - 1)) * width;
          const y = getDrawdownY(point.drawdown);
          return `${index === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");
    }, [data, getDrawdownY, width]);

    const drawdownAreaPath = useMemo(() => {
      if (data.length === 0) {
        return "";
      }

      const baselineY = drawdownZeroLineY;
      const segments = data
        .map((point, index) => {
          const x =
            data.length <= 1 ? width / 2 : (index / (data.length - 1)) * width;
          const y = getDrawdownY(point.drawdown);
          return `L ${x} ${y}`;
        })
        .join(" ");

      return `M 0 ${baselineY} ${segments} L ${width} ${baselineY} Z`;
    }, [data, drawdownZeroLineY, getDrawdownY, width]);

    // Drawdown chart hover
    const drawdownHover = useChartHover(data, {
      chartType: "drawdown",
      chartWidth: width,
      chartHeight: DRAWDOWN_CONSTANTS.CHART_HEIGHT,
      chartPadding: 0,
      minValue: drawdownMinValue,
      maxValue: DRAWDOWN_CONSTANTS.DEFAULT_MAX,
      getYValue: point => point.drawdown,
      buildHoverData: (point, x, _y, index) => {
        const yPosition = getDrawdownY(point.drawdown);

        return {
          chartType: "drawdown" as const,
          x,
          y: yPosition,
          date: new Date(point.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          drawdown: point.drawdown,
          peakDate: findPeakDate(referenceData, index),
          distanceFromPeak: calculateDaysSincePeak(referenceData, index),
        };
      },
      testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
    });

    return (
      <div className="relative h-80">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          data-chart-type="drawdown"
          aria-label={CHART_LABELS.drawdown}
          {...getChartInteractionProps(drawdownHover)}
        >
          <text x="16" y="20" opacity="0">
            Drawdown percentages relative to portfolio peak values
          </text>
          <defs>
            <linearGradient
              id="drawdownGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* Zero line */}
          <line
            x1="0"
            y1={drawdownZeroLineY}
            x2={width}
            y2={drawdownZeroLineY}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* Drawdown area */}
          {drawdownAreaPath && (
            <path d={drawdownAreaPath} fill="url(#drawdownGradient)" />
          )}

          {/* Drawdown line */}
          {drawdownLinePath && (
            <path
              d={drawdownLinePath}
              fill="none"
              stroke="#f97316"
              strokeWidth="2.5"
            />
          )}

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={drawdownHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          <span>0%</span>
          <span>-5%</span>
          <span>-10%</span>
          <span>-15%</span>
          <span>-20%</span>
        </div>

        {/* Hover Tooltip */}
        <ChartTooltip
          hoveredPoint={drawdownHover.hoveredPoint}
          chartWidth={width}
          chartHeight={height}
        />
      </div>
    );
  }
);

DrawdownChart.displayName = "DrawdownChart";

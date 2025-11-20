"use client";

import { memo, useMemo } from "react";

import { useChartHover } from "../../../hooks/useChartHover";
import { getSharpeInterpretation } from "../../../lib/chartHoverUtils";
import { CHART_DIMENSIONS, SHARPE_CONSTANTS } from "../chartConstants";
import { ENABLE_TEST_AUTO_HOVER, getChartInteractionProps } from "../utils";
import { MetricChartLayout } from "./MetricChartLayout";
import { buildAreaPath, buildLinePath } from "./pathBuilders";

interface SharpeChartProps {
  data: { date: string; sharpe: number }[];
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

    const toSharpeY = (value: number) =>
      250 - (value / SHARPE_CONSTANTS.MAX_VALUE) * 200;

    const sharpeLinePath = useMemo(
      () =>
        buildLinePath({
          data,
          width,
          getY: point => toSharpeY(point.sharpe ?? 0),
        }),
      [data, width]
    );

    const sharpeAreaPath = useMemo(
      () =>
        buildAreaPath({
          data,
          width,
          baseY: 250,
          getY: point => toSharpeY(point.sharpe ?? 0),
        }),
      [data, width]
    );

    const referenceLineY = useMemo(
      () =>
        250 -
        (SHARPE_CONSTANTS.GOOD_THRESHOLD / SHARPE_CONSTANTS.MAX_VALUE) * 200,
      []
    );

    return (
      <MetricChartLayout
        chartType="sharpe"
        width={width}
        height={height}
        gradientId="sharpeGradient"
        gradientStops={[
          { offset: "0%", color: "#10b981", opacity: "0.3" },
          { offset: "100%", color: "#10b981", opacity: "0" },
        ]}
        linePath={sharpeLinePath}
        areaPath={sharpeAreaPath}
        lineColor="#10b981"
        hoveredPoint={sharpeHover.hoveredPoint}
        interactionProps={getChartInteractionProps(sharpeHover)}
        yAxisLabels={["3.5", "2.5", "1.5", "0.5", "-0.5", "-1.0"]}
        legend={
          <div>
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
        }
        description="Rolling Sharpe ratio trend for the portfolio"
        extraSvgContent={
          <line
            x1="0"
            y1={referenceLineY}
            x2={width}
            y2={referenceLineY}
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.5"
          />
        }
      />
    );
  }
);

SharpeChart.displayName = "SharpeChart";

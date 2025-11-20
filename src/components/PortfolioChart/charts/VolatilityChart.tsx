"use client";

import { memo, useMemo } from "react";

import { useChartHover } from "../../../hooks/useChartHover";
import { getVolatilityRiskLevel } from "../../../lib/chartHoverUtils";
import { CHART_DIMENSIONS, VOLATILITY_CONSTANTS } from "../chartConstants";
import { ENABLE_TEST_AUTO_HOVER, getChartInteractionProps } from "../utils";
import { MetricChartLayout } from "./MetricChartLayout";
import { buildAreaPath, buildLinePath } from "./pathBuilders";

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
      <MetricChartLayout
        chartType="volatility"
        width={width}
        height={height}
        gradientId="volatilityGradient"
        gradientStops={[
          { offset: "0%", color: "#f59e0b", opacity: "0.3" },
          { offset: "100%", color: "#f59e0b", opacity: "0" },
        ]}
        linePath={volatilityLinePath}
        areaPath={volatilityAreaPath}
        lineColor="#f59e0b"
        hoveredPoint={volatilityHover.hoveredPoint}
        interactionProps={getChartInteractionProps(volatilityHover)}
        yAxisLabels={["100%", "75%", "50%", "25%", "5%"]}
        legend={
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-amber-500"></div>
              <span className="text-white">30-Day Volatility</span>
            </div>
          </div>
        }
        description="Rolling volatility expressed as annualized percentage"
      />
    );
  }
);

VolatilityChart.displayName = "VolatilityChart";

"use client";

import { motion } from "framer-motion";
import { memo } from "react";

import { ASSET_CATEGORIES, CHART_COLORS } from "../../../constants/portfolio";
import { useChartHover } from "../../../hooks/useChartHover";
import type { AssetAllocationPoint } from "../../../types/portfolio";
import { ChartTooltip } from "../../charts";
import { ALLOCATION_CONSTANTS, CHART_DIMENSIONS } from "../chartConstants";
import {
  CHART_LABELS,
  ENABLE_TEST_AUTO_HOVER,
  getChartInteractionProps,
} from "../utils";

interface AllocationChartProps {
  data: AssetAllocationPoint[];
  width?: number;
  height?: number;
  padding?: number;
}

/**
 * AllocationChart - Asset category allocation over time
 *
 * Displays portfolio allocation breakdown across asset categories (BTC, ETH, Stablecoin, Altcoin).
 * Uses stacked bars at each time point, normalized to 100% allocation.
 *
 * Features:
 * - 100% stacked visualization
 * - Color-coded asset categories
 * - Vertical line hover indicator
 * - Percentage-based tooltip
 */
export const AllocationChart = memo<AllocationChartProps>(
  ({
    data,
    width = CHART_DIMENSIONS.WIDTH,
    height = CHART_DIMENSIONS.HEIGHT,
    padding = CHART_DIMENSIONS.PADDING,
  }) => {
    // Allocation chart hover
    const allocationHover = useChartHover(data, {
      chartType: "allocation",
      chartWidth: width,
      chartHeight: height,
      chartPadding: padding,
      minValue: ALLOCATION_CONSTANTS.MIN_VALUE,
      maxValue: ALLOCATION_CONSTANTS.MAX_VALUE,
      getYValue: () => 50, // Mid-point for stacked chart
      buildHoverData: (point, x, y) => {
        const total = point.btc + point.eth + point.stablecoin + point.altcoin;
        return {
          chartType: "allocation" as const,
          x,
          y,
          date: new Date(point.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          btc: total > 0 ? (point.btc / total) * 100 : 0,
          eth: total > 0 ? (point.eth / total) * 100 : 0,
          stablecoin: total > 0 ? (point.stablecoin / total) * 100 : 0,
          altcoin: total > 0 ? (point.altcoin / total) * 100 : 0,
        };
      },
      testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
    });

    if (data.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-sm text-gray-500">
          No allocation history available for the selected period.
        </div>
      );
    }

    return (
      <div className="h-80">
        <div className="relative h-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full"
            data-chart-type="allocation"
            aria-label={CHART_LABELS.allocation}
            {...getChartInteractionProps(allocationHover)}
          >
            <text x="16" y="20" opacity="0">
              Asset allocation percentages across core holdings
            </text>
            {data.map((point, index) => {
              const total =
                point.btc + point.eth + point.stablecoin + point.altcoin;

              if (total <= 0) {
                return null;
              }

              const x =
                data.length <= 1
                  ? width / 2
                  : (index / (data.length - 1)) * width;

              let yOffset = height;

              // Stack areas
              const assets = [
                { value: point.btc, color: CHART_COLORS.btc },
                { value: point.eth, color: CHART_COLORS.eth },
                { value: point.stablecoin, color: CHART_COLORS.stablecoin },
                { value: point.altcoin, color: CHART_COLORS.altcoin },
              ];

              return (
                <g key={index}>
                  {assets.map((asset, assetIndex) => {
                    const assetHeight =
                      total > 0 ? (asset.value / total) * 280 : 0;
                    const y = yOffset - assetHeight;
                    yOffset -= assetHeight;

                    const left = x - 2;
                    const right = x + 2;
                    const bottom = y + assetHeight;

                    return (
                      <path
                        key={assetIndex}
                        d={`M ${left} ${y} L ${right} ${y} L ${right} ${bottom} L ${left} ${bottom} Z`}
                        fill={asset.color}
                        opacity="0.8"
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Vertical line indicator for stacked chart */}
            {allocationHover.hoveredPoint && (
              <motion.line
                x1={allocationHover.hoveredPoint.x}
                y1={10}
                x2={allocationHover.hoveredPoint.x}
                y2={290}
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ pointerEvents: "none" }}
                aria-hidden="true"
              />
            )}
          </svg>

          {/* Legend */}
          <div className="absolute top-4 right-4 space-y-1 text-xs pointer-events-none">
            {["btc", "eth", "stablecoin", "altcoin"].map(key => {
              const category =
                ASSET_CATEGORIES[key as keyof typeof ASSET_CATEGORIES];
              return (
                <div key={key} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: category.chartColor }}
                  ></div>
                  <span className="text-gray-300">{category.shortLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Hover Tooltip */}
          <ChartTooltip
            hoveredPoint={allocationHover.hoveredPoint}
            chartWidth={width}
            chartHeight={height}
          />
        </div>
      </div>
    );
  }
);

AllocationChart.displayName = "AllocationChart";

"use client";

import { memo, useMemo } from "react";

import { useChartHover } from "../../../hooks/useChartHover";
import {
  formatAxisLabel,
  generateAreaPath,
  generateSVGPath,
  generateYAxisLabels,
} from "../../../lib/chartUtils";
import { ensureNonNegative } from "../../../lib/mathUtils";
import { ChartIndicator, ChartTooltip } from "../../charts";
import { CHART_DIMENSIONS } from "../chartConstants";
import type { PortfolioStackedDataPoint } from "../types";
import {
  CHART_LABELS,
  ENABLE_TEST_AUTO_HOVER,
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
 * Displays stacked portfolio performance with DeFi and Wallet breakdown.
 * Uses stacked area chart to show composition while maintaining total value visibility.
 *
 * Features:
 * - Stacked areas for DeFi (purple) and Wallet (cyan) values
 * - Separation line between regions
 * - Total portfolio outline with glow effect
 * - Interactive hover with detailed tooltips
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

    // Generate stacked area paths for DeFi and Wallet visualization
    const { defiAreaPath, walletAreaPath, defiLinePath, totalPath } =
      useMemo(() => {
        if (data.length === 0) {
          return {
            defiAreaPath: "",
            walletAreaPath: "",
            defiLinePath: "",
            totalPath: "",
          };
        }

        const totals = data.map(getStackedTotalValue);
        const minStackedValue = Math.min(...totals);
        const maxStackedValue = Math.max(...totals);
        const valueRange = Math.max(maxStackedValue - minStackedValue, 1);

        // DeFi area: from baseline (bottom of chart) to defiValue
        const defiPath = generateAreaPath(
          data,
          p => (p as PortfolioStackedDataPoint).defiValue,
          width,
          height,
          padding
        );

        const walletSegments = data.map((point, index) => {
          const x =
            data.length <= 1 ? width / 2 : (index / (data.length - 1)) * width;

          const defiBoundary = ensureNonNegative(point.defiValue);
          const totalValue = getStackedTotalValue(point);

          const defiY =
            height -
            padding -
            ((defiBoundary - minStackedValue) / valueRange) *
              (height - 2 * padding);

          const totalY =
            height -
            padding -
            ((totalValue - minStackedValue) / valueRange) *
              (height - 2 * padding);

          return { x, defiY, totalY };
        });

        const forwardPath = walletSegments
          .map((seg, i) => `${i === 0 ? "M" : "L"} ${seg.x} ${seg.totalY}`)
          .join(" ");

        const reversePath = walletSegments
          .slice()
          .reverse()
          .map(seg => `L ${seg.x} ${seg.defiY}`)
          .join(" ");

        const walletPath = walletSegments.length
          ? `${forwardPath} ${reversePath} Z`
          : "";

        // Generate boundary line between DeFi and Wallet regions
        const defiLine = walletSegments.length
          ? walletSegments
              .map((seg, i) => `${i === 0 ? "M" : "L"} ${seg.x} ${seg.defiY}`)
              .join(" ")
          : "";

        const totalOutline = generateSVGPath(
          data,
          p => getStackedTotalValue(p as PortfolioStackedDataPoint),
          width,
          height,
          padding
        );

        return {
          defiAreaPath: defiPath,
          walletAreaPath: walletPath,
          defiLinePath: defiLine,
          totalPath: totalOutline,
        };
      }, [data, width, height, padding]);

    // Performance chart hover
    const performanceHover = useChartHover(data, {
      chartType: "performance",
      chartWidth: width,
      chartHeight: height,
      chartPadding: padding,
      minValue,
      maxValue,
      getYValue: point => getStackedTotalValue(point),
      buildHoverData: (point, x, y) => ({
        chartType: "performance" as const,
        x,
        y,
        date: new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        value: getStackedTotalValue(point),
        benchmark: point.benchmark || 0,
        defiValue: point.defiValue,
        walletValue: point.walletValue,
      }),
      testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
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
          <defs>
            {/* DeFi gradient - Purple with enhanced contrast */}
            <linearGradient id="defiGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.25" />
            </linearGradient>

            {/* Wallet gradient - Cyan with enhanced contrast */}
            <linearGradient
              id="walletGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Stacked Areas: DeFi (bottom) + Wallet (top) */}
          {defiAreaPath && <path d={defiAreaPath} fill="url(#defiGradient)" />}

          {walletAreaPath && (
            <path d={walletAreaPath} fill="url(#walletGradient)" />
          )}

          {/* Separation line between DeFi and Wallet */}
          {defiLinePath && (
            <path
              d={defiLinePath}
              fill="none"
              stroke="#64748b"
              strokeWidth="1"
              opacity="0.4"
            />
          )}

          {/* Total portfolio outline with glow effect */}
          {totalPath && (
            <>
              {/* White glow layer for contrast */}
              <path
                d={totalPath}
                fill="none"
                stroke="white"
                strokeWidth="4"
                opacity="0.15"
                className="blur-sm"
              />
              {/* Main outline in lighter purple */}
              <path
                d={totalPath}
                fill="none"
                stroke="#c4b5fd"
                strokeWidth="2.5"
                className="drop-shadow-lg"
              />
            </>
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
              className="w-3 h-2 rounded-sm"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(139, 92, 246, 0.6), rgba(139, 92, 246, 0.25))",
              }}
            ></div>
            <span className="text-white">DeFi</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div
              className="w-3 h-2 rounded-sm"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(6, 182, 212, 0.7), rgba(6, 182, 212, 0.3))",
              }}
            ></div>
            <span className="text-white">Wallet</span>
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

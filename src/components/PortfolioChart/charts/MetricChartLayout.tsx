"use client";

import type { ReactNode, SVGProps } from "react";

import type { ChartHoverState } from "@/types/chartHover";

import { ChartIndicator, ChartTooltip } from "../../charts";
import { ChartHelpModal } from "../components";
import { CHART_LABELS } from "../utils";
import { ChartGrid } from "./ChartGrid";

type MetricChartType = "sharpe" | "volatility";

interface GradientStop {
  offset: string;
  color: string;
  opacity: string;
}

interface MetricChartLayoutProps {
  chartType: MetricChartType;
  width: number;
  height: number;
  gradientId: string;
  gradientStops: GradientStop[];
  linePath?: string | null;
  areaPath?: string | null;
  lineColor: string;
  hoveredPoint: ChartHoverState | null;
  interactionProps: SVGProps<SVGSVGElement>;
  yAxisLabels: string[];
  legend: ReactNode;
  description: string;
  extraSvgContent?: ReactNode;
}

export function MetricChartLayout({
  chartType,
  width,
  height,
  gradientId,
  gradientStops,
  linePath,
  areaPath,
  lineColor,
  hoveredPoint,
  interactionProps,
  yAxisLabels,
  legend,
  description,
  extraSvgContent,
}: MetricChartLayoutProps) {
  return (
    <div className="relative h-80">
      <ChartGrid />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        data-chart-type={chartType}
        aria-label={CHART_LABELS[chartType]}
        {...interactionProps}
      >
        <text x="16" y="20" opacity="0">
          {description}
        </text>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            {gradientStops.map(stop => (
              <stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </linearGradient>
        </defs>

        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            className="drop-shadow-lg"
          />
        )}

        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

        {extraSvgContent}

        <ChartIndicator hoveredPoint={hoveredPoint} />
      </svg>

      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
        {yAxisLabels.map(label => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="absolute top-4 right-4 flex items-start gap-3">
        <div className="text-xs pointer-events-none">{legend}</div>
        <div className="pointer-events-auto">
          <ChartHelpModal chartType={chartType} />
        </div>
      </div>

      <ChartTooltip
        hoveredPoint={hoveredPoint}
        chartWidth={width}
        chartHeight={height}
      />
    </div>
  );
}

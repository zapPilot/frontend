/**
 * ChartTooltip Component
 *
 * Reusable tooltip component for all chart types with smart positioning
 * and chart-specific content rendering.
 */

import { motion } from "framer-motion";
import { useRef } from "react";

import type {
  AllocationHoverData,
  ChartHoverState,
  DailyYieldHoverData,
  DrawdownHoverData,
  PerformanceHoverData,
  SharpeHoverData,
  VolatilityHoverData,
} from "@/types/ui/chartHover";

import {
  AllocationTooltip,
  DailyYieldTooltip,
  DrawdownTooltip,
  PerformanceTooltip,
  SharpeTooltip,
  VolatilityTooltip,
} from "./tooltipContent";

// Charts that have legends at the top requiring tooltip offset
const CHARTS_WITH_TOP_LEGEND = new Set([
  "performance",
  "asset-allocation",
  "sharpe",
  "volatility",
]);

// Positioning constants
const TOOLTIP_MIN_WIDTH = 180;
const TOOLTIP_MIN_HEIGHT = 120;
const EDGE_PADDING = 12;
const VERTICAL_OFFSET = 20;
const LEGEND_GUARD_TOP = 60;

interface ChartTooltipProps {
  /** Current hover state or null */
  hoveredPoint: ChartHoverState | null;
  /** Chart width for positioning calculations */
  chartWidth?: number;
  /** Chart height for positioning calculations */
  chartHeight?: number;
}

/**
 * Render chart-specific tooltip content based on chart type
 */
function TooltipContent({ data }: { data: ChartHoverState }) {
  switch (data.chartType) {
    case "performance":
      return <PerformanceTooltip data={data as PerformanceHoverData} />;
    case "asset-allocation":
      return <AllocationTooltip data={data as AllocationHoverData} />;
    case "drawdown-recovery":
      return <DrawdownTooltip data={data as DrawdownHoverData} />;
    case "sharpe":
      return <SharpeTooltip data={data as SharpeHoverData} />;
    case "volatility":
      return <VolatilityTooltip data={data as VolatilityHoverData} />;
    case "daily-yield":
      return <DailyYieldTooltip data={data as DailyYieldHoverData} />;
    default:
      return null;
  }
}

/**
 * Calculate tooltip position to keep it within bounds
 */
function calculatePosition(
  hoveredPoint: ChartHoverState,
  chartWidth: number,
  chartHeight: number,
  tooltipWidth: number,
  tooltipHeight: number
) {
  const containerWidth = hoveredPoint.containerWidth ?? chartWidth;
  const containerHeight = hoveredPoint.containerHeight ?? chartHeight;

  const pointerX =
    hoveredPoint.screenX ??
    (chartWidth > 0 ? (hoveredPoint.x / chartWidth) * containerWidth : 0);
  const pointerY =
    hoveredPoint.screenY ??
    (chartHeight > 0 ? (hoveredPoint.y / chartHeight) * containerHeight : 0);

  // Horizontal positioning
  let left = pointerX;
  let translateX = "-50%";
  const halfWidth = tooltipWidth / 2;

  if (left - halfWidth < EDGE_PADDING) {
    left = Math.max(left, EDGE_PADDING);
    translateX = "0";
  } else if (left + halfWidth > containerWidth - EDGE_PADDING) {
    left = Math.min(left, containerWidth - EDGE_PADDING);
    translateX = "-100%";
  }

  // Vertical positioning
  let top = pointerY - VERTICAL_OFFSET;
  let translateY = "-100%";

  if (top - tooltipHeight < EDGE_PADDING) {
    top = Math.min(pointerY + VERTICAL_OFFSET, containerHeight - EDGE_PADDING);
    translateY = "0";
  }

  // Avoid top legend overlap
  if (CHARTS_WITH_TOP_LEGEND.has(hoveredPoint.chartType)) {
    if (translateY === "-100%" && top < LEGEND_GUARD_TOP + tooltipHeight) {
      translateY = "0";
      top = Math.max(pointerY + VERTICAL_OFFSET, LEGEND_GUARD_TOP);
    }
  }

  return { left, top, translateX, translateY };
}

/**
 * ChartTooltip - Smart positioning tooltip for all chart types
 */
export function ChartTooltip({
  hoveredPoint,
  chartWidth = 800,
  chartHeight = 300,
}: ChartTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  if (!hoveredPoint) return null;

  const tooltipWidth = tooltipRef.current?.offsetWidth || TOOLTIP_MIN_WIDTH;
  const tooltipHeight = tooltipRef.current?.offsetHeight || TOOLTIP_MIN_HEIGHT;

  const { left, top, translateX, translateY } = calculatePosition(
    hoveredPoint,
    chartWidth,
    chartHeight,
    tooltipWidth,
    tooltipHeight
  );

  return (
    <motion.div
      className="absolute z-10 pointer-events-none"
      role="tooltip"
      data-chart-type={hoveredPoint.chartType}
      data-testid="chart-tooltip"
      style={{
        left,
        top,
        transform: `translate(${translateX}, ${translateY})`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        ref={tooltipRef}
        className="px-3 py-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl min-w-[160px]"
      >
        <TooltipContent data={hoveredPoint} />
      </div>
    </motion.div>
  );
}

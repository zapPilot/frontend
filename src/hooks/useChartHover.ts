/**
 * useChartHover Hook
 *
 * Generic hook for chart hover functionality with RAF optimization.
 * Extracted from PortfolioChart to enable reuse across all chart types.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
} from "react";
import type { ChartHoverState } from "../types/chartHover";

/**
 * Configuration options for chart hover behavior
 */
export interface UseChartHoverOptions<T> {
  /** Chart type discriminator for hover state */
  chartType: string;
  /** SVG viewBox width */
  chartWidth: number;
  /** SVG viewBox height */
  chartHeight: number;
  /** Padding around chart content */
  chartPadding: number;
  /** Minimum value in data range */
  minValue: number;
  /** Maximum value in data range */
  maxValue: number;
  /** Function to extract the primary value for Y positioning */
  getYValue: (point: T) => number;
  /** Function to build chart-specific hover data */
  buildHoverData: (
    point: T,
    x: number,
    y: number,
    index: number
  ) => ChartHoverState;
  /** Whether hover is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Return type for useChartHover hook
 */
export interface UseChartHoverReturn {
  /** Current hover state or null if not hovering */
  hoveredPoint: ChartHoverState | null;
  /** Mouse move handler to attach to SVG element */
  handleMouseMove: (event: MouseEvent<SVGSVGElement>) => void;
  /** Touch move handler for mobile interactions */
  handleTouchMove: (event: TouchEvent<SVGSVGElement>) => void;
  /** Mouse leave handler to attach to SVG element */
  handleMouseLeave: () => void;
  /** Touch end handler to clear hover state on touch end/cancel */
  handleTouchEnd: () => void;
}

/**
 * Generic chart hover hook with RAF optimization
 *
 * @example
 * ```tsx
 * const { hoveredPoint, handleMouseMove, handleMouseLeave } = useChartHover(
 *   portfolioData,
 *   {
 *     chartType: 'performance',
 *     chartWidth: 800,
 *     chartHeight: 300,
 *     chartPadding: 10,
 *     minValue: 0,
 *     maxValue: 100000,
 *     getYValue: (point) => point.value,
 *     buildHoverData: (point, x, y, index) => ({
 *       chartType: 'performance',
 *       x,
 *       y,
 *       date: formatDate(point.date),
 *       value: point.value,
 *       benchmark: point.benchmark
 *     })
 *   }
 * );
 * ```
 */
export function useChartHover<T>(
  data: T[],
  options: UseChartHoverOptions<T>
): UseChartHoverReturn {
  const {
    chartWidth,
    chartHeight,
    chartPadding,
    minValue,
    maxValue,
    getYValue,
    buildHoverData,
    enabled = true,
  } = options;

  const [hoveredPoint, setHoveredPoint] = useState<ChartHoverState | null>(
    null
  );

  // RAF optimization refs
  const rafId = useRef<number | null>(null);
  const lastIndexRef = useRef<number | null>(null);

  // Calculate value range for Y positioning
  const valueRange = Math.max(maxValue - minValue, 1);

  /**
   * Mouse move handler with RAF optimization
   * Calculates hover position and builds chart-specific hover state
   */
  const updateHoverFromClientX = useCallback(
    (clientX: number, svg: SVGSVGElement) => {
      if (!enabled || data.length === 0) return;

      const rect = svg.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const svgWidth = rect.width || chartWidth || 1;

      // Calculate the data index based on pointer position
      const rawIndex = (mouseX / svgWidth) * (data.length - 1);
      const clampedIndex = Math.max(
        0,
        Math.min(Math.round(rawIndex), data.length - 1)
      );

      // Drop updates if index didn't change (reduces state churn)
      if (lastIndexRef.current === clampedIndex) return;
      lastIndexRef.current = clampedIndex;

      // Schedule state update at next animation frame
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const point = data[clampedIndex];
        if (!point) return;

        // Calculate X position in SVG coordinates
        const boundedMouseX = Math.max(0, Math.min(mouseX, svgWidth));
        const normalizedX = svgWidth
          ? boundedMouseX / svgWidth
          : clampedIndex / Math.max(data.length - 1, 1);
        const x = normalizedX * chartWidth;

        // Calculate Y position in SVG coordinates based on value
        const yValue = getYValue(point);
        const y =
          chartHeight -
          chartPadding -
          ((yValue - minValue) / valueRange) * (chartHeight - 2 * chartPadding);

        // Build chart-specific hover data
        const hoverData = buildHoverData(point, x, y, clampedIndex);

        setHoveredPoint(hoverData);
        if (process.env.NODE_ENV === "test") {
          // eslint-disable-next-line no-console
          console.log("hover update", {
            chartType: options.chartType ?? "unknown",
            x,
            y,
          });
        }
      });
    },
    [
      enabled,
      data,
      chartWidth,
      chartHeight,
      chartPadding,
      minValue,
      valueRange,
      getYValue,
      buildHoverData,
    ]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent<SVGSVGElement>) => {
      updateHoverFromClientX(event.clientX, event.currentTarget);
    },
    [updateHoverFromClientX]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      updateHoverFromClientX(event.clientX, event.currentTarget);
    },
    [updateHoverFromClientX]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (process.env.NODE_ENV === "test") {
        // eslint-disable-next-line no-console
        console.log("pointer down", options.chartType ?? "unknown");
      }
      updateHoverFromClientX(event.clientX, event.currentTarget);
    },
    [updateHoverFromClientX]
  );

  /**
   * Mouse leave handler
   * Cancels pending RAF and clears hover state
   */
  const handleMouseLeave = useCallback(() => {
    if (rafId.current != null) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    lastIndexRef.current = null;
    setHoveredPoint(null);
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent<SVGSVGElement>) => {
      const touch = event.touches[0] ?? event.changedTouches[0];
      if (!touch) return;
      if (event.cancelable) {
        event.preventDefault();
      }

      updateHoverFromClientX(touch.clientX, event.currentTarget);
    },
    [updateHoverFromClientX]
  );

  const handleTouchEnd = useCallback(() => {
    handleMouseLeave();
  }, [handleMouseLeave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return {
    hoveredPoint,
    handleMouseMove,
    handlePointerMove,
    handlePointerDown,
    handleTouchMove,
    handleMouseLeave,
    handleTouchEnd,
  };
}

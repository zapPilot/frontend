/**
 * useChartHover Hook
 *
 * Generic hook for chart hover functionality with RAF optimization.
 * Extracted from PortfolioChart to enable reuse across all chart types.
 */

import {
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { clamp, clampMin } from "../lib/mathUtils";
import type { ChartHoverState } from "../types/chartHover";
import { logger } from "../utils/logger";

/**
 * Configuration options for chart hover behavior
 */
interface UseChartHoverOptions<T> {
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
  /** Enable deterministic hover initialization in test environments */
  testAutoPopulate?: boolean;
}

/**
 * Return type for useChartHover hook
 */
interface UseChartHoverReturn {
  /** Current hover state or null if not hovering */
  hoveredPoint: ChartHoverState | null;
  /** Mouse move handler to attach to SVG element */
  handleMouseMove: (event: MouseEvent<SVGSVGElement>) => void;
  /** Pointer move handler for unified pointer interactions */
  handlePointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  /** Pointer down handler for grabbing hover state on pointer interactions */
  handlePointerDown: (event: PointerEvent<SVGSVGElement>) => void;
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
  if (
    typeof window !== "undefined" &&
    typeof window.PointerEvent === "undefined"
  ) {
    class PointerEventPolyfill extends MouseEvent {}

    (window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
      PointerEventPolyfill as unknown as typeof PointerEvent;
  }

  const {
    chartType,
    chartWidth,
    chartHeight,
    chartPadding,
    minValue,
    maxValue,
    getYValue,
    buildHoverData,
    enabled = true,
    testAutoPopulate = false,
  } = options;

  const [hoveredPoint, setHoveredPoint] = useState<ChartHoverState | null>(
    null
  );

  // RAF optimization refs
  const rafId = useRef<number | null>(null);
  const lastIndexRef = useRef<number | null>(null);
  const hasTestAutoPopulatedRef = useRef(false);
  const testAutoHideTimerRef = useRef<number | null>(null);
  const isAutoHoverActiveRef = useRef(false);

  // Calculate value range for Y positioning
  const valueRange = clampMin(maxValue - minValue, 1);

  /**
   * Mouse move handler with RAF optimization
   * Calculates hover position and builds chart-specific hover state
   */
  const updateHoverFromClientPoint = useCallback(
    (clientX: number, clientY: number | undefined, svg: SVGSVGElement) => {
      if (!enabled || data.length === 0) return;

      const rect = svg.getBoundingClientRect();
      const svgWidth = rect.width || chartWidth || 1;
      const svgHeight = rect.height || chartHeight || 1;

      const effectiveClientX = Number.isFinite(clientX)
        ? clientX
        : rect.left + svgWidth / 2;
      const effectiveClientY =
        typeof clientY === "number" && Number.isFinite(clientY)
          ? clientY
          : rect.top + svgHeight / 2;

      let viewBoxX: number | null = null;

      const supportsCtm =
        typeof svg.getScreenCTM === "function" &&
        typeof svg.createSVGPoint === "function";
      if (supportsCtm) {
        const ctm = svg.getScreenCTM();
        const point = svg.createSVGPoint();
        point.x = effectiveClientX;
        point.y = effectiveClientY;

        if (ctm) {
          const inverseMatrix = ctm.inverse();
          const transformedPoint = point.matrixTransform(inverseMatrix);
          if (Number.isFinite(transformedPoint.x)) {
            viewBoxX = transformedPoint.x;
          }
        }
      }

      if (viewBoxX == null) {
        const mouseX = effectiveClientX - rect.left;
        const normalizedX = svgWidth > 0 ? mouseX / svgWidth : 0;
        viewBoxX = normalizedX * chartWidth;
      }

      const normalizedViewBoxX = clamp(
        chartWidth > 0 ? viewBoxX / chartWidth : 0,
        0,
        1
      );

      // Calculate the data index based on pointer position
      const rawIndex = normalizedViewBoxX * (data.length - 1);
      const clampedIndex = clamp(Math.round(rawIndex), 0, data.length - 1);

      // Drop updates if index didn't change (reduces state churn)
      if (lastIndexRef.current === clampedIndex) return;
      lastIndexRef.current = clampedIndex;

      const updateHoverState = () => {
        const point = data[clampedIndex];
        if (!point) return;

        // Calculate X position in SVG coordinates from data point index
        // This ensures the indicator aligns exactly with the selected data point
        const x =
          data.length <= 1
            ? chartWidth / 2
            : (clampedIndex / (data.length - 1)) * chartWidth;

        // Calculate Y position in SVG coordinates based on value
        const yValue = getYValue(point);
        const y =
          chartHeight -
          chartPadding -
          ((yValue - minValue) / valueRange) * (chartHeight - 2 * chartPadding);

        // Build chart-specific hover data
        const scaleX = chartWidth > 0 ? svgWidth / chartWidth : 1;
        const scaleY = chartHeight > 0 ? svgHeight / chartHeight : 1;
        const screenX = x * scaleX;
        const screenY = y * scaleY;

        const hoverData = buildHoverData(point, x, y, clampedIndex);

        isAutoHoverActiveRef.current = false;
        setHoveredPoint({
          ...hoverData,
          containerWidth: svgWidth,
          containerHeight: svgHeight,
          screenX,
          screenY,
        });
        if (process.env.NODE_ENV === "test") {
          logger.debug(
            "hover update",
            {
              chartType: chartType ?? "unknown",
              x,
              y,
            },
            "ChartHover"
          );
        }
      };

      if (testAutoPopulate) {
        updateHoverState();
        return;
      }

      // Schedule state update at next animation frame
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(updateHoverState);
    },
    [
      enabled,
      data,
      chartType,
      chartWidth,
      chartHeight,
      chartPadding,
      minValue,
      valueRange,
      getYValue,
      buildHoverData,
      testAutoPopulate,
    ]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent<SVGSVGElement>) => {
      updateHoverFromClientPoint(
        event.clientX,
        event.clientY,
        event.currentTarget
      );
    },
    [updateHoverFromClientPoint]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      updateHoverFromClientPoint(
        event.clientX,
        event.clientY,
        event.currentTarget
      );
    },
    [updateHoverFromClientPoint]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (process.env.NODE_ENV === "test") {
        logger.debug("pointer down", chartType ?? "unknown", "ChartHover");
      }
      updateHoverFromClientPoint(
        event.clientX,
        event.clientY,
        event.currentTarget
      );
    },
    [chartType, updateHoverFromClientPoint]
  );

  /**
   * Mouse leave handler
   * Cancels pending RAF and clears hover state
   */
  const handleMouseLeave = useCallback(() => {
    if (rafId.current != null) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    lastIndexRef.current = null;
    isAutoHoverActiveRef.current = false;
    setHoveredPoint(null);
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent<SVGSVGElement>) => {
      const touch = event.touches[0] ?? event.changedTouches[0];
      if (!touch) return;
      if (event.cancelable) {
        event.preventDefault();
      }

      updateHoverFromClientPoint(
        touch.clientX,
        touch.clientY,
        event.currentTarget
      );
    },
    [updateHoverFromClientPoint]
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
      if (testAutoHideTimerRef.current != null) {
        clearTimeout(testAutoHideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      process.env.NODE_ENV === "test" &&
      testAutoPopulate &&
      enabled &&
      hoveredPoint == null &&
      data.length > 0 &&
      !hasTestAutoPopulatedRef.current
    ) {
      const index = Math.min(Math.floor(data.length / 2), data.length - 1);
      const point = data[index];
      if (!point) return;

      const normalizedX =
        data.length <= 1 ? 0.5 : index / clampMin(data.length - 1, 1);
      const x = normalizedX * chartWidth;
      const yValue = getYValue(point);
      const y =
        chartHeight -
        chartPadding -
        ((yValue - minValue) / valueRange) * (chartHeight - 2 * chartPadding);

      setHoveredPoint(buildHoverData(point, x, y, index));
      hasTestAutoPopulatedRef.current = true;
      isAutoHoverActiveRef.current = true;
    }
  }, [
    buildHoverData,
    chartHeight,
    chartPadding,
    chartWidth,
    data,
    enabled,
    getYValue,
    hoveredPoint,
    minValue,
    testAutoPopulate,
    valueRange,
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "test" || !testAutoPopulate) {
      return;
    }

    if (hoveredPoint != null && isAutoHoverActiveRef.current) {
      if (testAutoHideTimerRef.current != null) {
        clearTimeout(testAutoHideTimerRef.current);
      }
      testAutoHideTimerRef.current = window.setTimeout(() => {
        setHoveredPoint(null);
        isAutoHoverActiveRef.current = false;
      }, 1000);
    } else if (hoveredPoint != null) {
      if (testAutoHideTimerRef.current != null) {
        clearTimeout(testAutoHideTimerRef.current);
        testAutoHideTimerRef.current = null;
      }
    }

    return () => {
      if (testAutoHideTimerRef.current != null) {
        clearTimeout(testAutoHideTimerRef.current);
        testAutoHideTimerRef.current = null;
      }
    };
  }, [hoveredPoint, testAutoPopulate]);

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

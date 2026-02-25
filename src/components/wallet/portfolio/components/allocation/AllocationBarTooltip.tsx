import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  label: string;
  percentage: number;
  color?: string;
  children: ReactNode;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowLeft: number;
}

const VIEWPORT_PADDING = 16;
const TOOLTIP_OFFSET = 8;
const ARROW_INSET = 12;
const TOOLTIP_BACKGROUND = "rgba(17, 24, 39, 0.95)";
const DEFAULT_BORDER_COLOR = "rgba(75, 85, 99, 0.5)";
const DEFAULT_LABEL_COLOR = "#10b981";

function calculateTooltipPosition(
  containerRect: DOMRect,
  tooltipRect: DOMRect,
  viewportWidth: number,
  scrollY: number
): TooltipPosition {
  let left =
    containerRect.left + containerRect.width / 2 - tooltipRect.width / 2;
  let arrowLeft = tooltipRect.width / 2;

  if (left < VIEWPORT_PADDING) {
    arrowLeft = containerRect.left + containerRect.width / 2 - VIEWPORT_PADDING;
    left = VIEWPORT_PADDING;
  } else if (left + tooltipRect.width > viewportWidth - VIEWPORT_PADDING) {
    const newLeft = viewportWidth - VIEWPORT_PADDING - tooltipRect.width;
    arrowLeft = containerRect.left + containerRect.width / 2 - newLeft;
    left = newLeft;
  }

  const constrainedArrowLeft = Math.max(
    ARROW_INSET,
    Math.min(arrowLeft, tooltipRect.width - ARROW_INSET)
  );
  const top = containerRect.top - tooltipRect.height - TOOLTIP_OFFSET + scrollY;

  return { top, left, arrowLeft: constrainedArrowLeft };
}

function getBorderColor(color: string | undefined): string {
  return color || DEFAULT_BORDER_COLOR;
}

function hideTooltip(
  setIsVisible: (isVisible: boolean) => void,
  setTooltipPosition: (position: TooltipPosition | null) => void
): void {
  setIsVisible(false);
  setTooltipPosition(null);
}

interface TooltipPortalContentProps {
  label: string;
  percentage: number;
  color?: string;
  tooltipPosition: TooltipPosition | null;
  tooltipRef: RefObject<HTMLDivElement | null>;
}

function TooltipPortalContent({
  label,
  percentage,
  color,
  tooltipPosition,
  tooltipRef,
}: TooltipPortalContentProps): ReactNode {
  const borderColor = getBorderColor(color);
  const labelColor = color || DEFAULT_LABEL_COLOR;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] px-3 py-2 text-sm rounded-lg shadow-xl pointer-events-none whitespace-nowrap"
      style={{
        top: tooltipPosition?.top ?? -9999,
        left: tooltipPosition?.left ?? -9999,
        backgroundColor: TOOLTIP_BACKGROUND,
        border: `1px solid ${borderColor}`,
        visibility: tooltipPosition ? "visible" : "hidden",
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-bold" style={{ color: labelColor }}>
          {label}
        </span>
        <span className="text-gray-400 font-mono text-xs">
          {percentage.toFixed(2)}%
        </span>
      </div>
      <div
        className="absolute w-2 h-2"
        style={{
          bottom: "-5px",
          left: tooltipPosition?.arrowLeft ?? 0,
          transform: "translateX(-50%) rotate(45deg)",
          backgroundColor: TOOLTIP_BACKGROUND,
          borderRight: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
        }}
      />
    </div>
  );
}

/**
 * Tooltip component for allocation bars with viewport-aware positioning
 *
 * Uses React Portal to escape parent overflow:hidden constraints and
 * implements sophisticated boundary detection to prevent viewport overflow.
 *
 * Features:
 * - Dynamic positioning with viewport boundary detection
 * - Arrow indicator that points to the hovered element
 * - Smooth show/hide transitions
 * - Automatic cleanup on unmount or data changes
 */
export function AllocationBarTooltip({
  label,
  percentage,
  color,
  children,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we're on client side for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const recalculatePosition = useCallback(() => {
    if (!containerRef.current || !tooltipRef.current) {
      return;
    }

    const nextPosition = calculateTooltipPosition(
      containerRef.current.getBoundingClientRect(),
      tooltipRef.current.getBoundingClientRect(),
      window.innerWidth,
      window.scrollY
    );
    setTooltipPosition(nextPosition);
  }, []);

  const handleMouseEnter = () => {
    setIsVisible(true);
    requestAnimationFrame(recalculatePosition);
  };

  const handleMouseLeave = () => {
    hideTooltip(setIsVisible, setTooltipPosition);
  };

  // Cleanup on unmount to ensure tooltip is hidden
  useEffect(() => {
    return () => {
      hideTooltip(setIsVisible, setTooltipPosition);
    };
  }, []);

  // Hide tooltip if component re-renders while visible (e.g., data update)
  useEffect(() => {
    if (isVisible && containerRef.current) {
      requestAnimationFrame(recalculatePosition);
    }
  }, [isVisible, recalculatePosition]);

  const tooltipPortal =
    isMounted && isVisible
      ? createPortal(
          <TooltipPortalContent
            label={label}
            percentage={percentage}
            tooltipPosition={tooltipPosition}
            tooltipRef={tooltipRef}
            {...(color !== undefined ? { color } : {})}
          />,
          document.body
        )
      : null;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseOut={handleMouseLeave}
    >
      {children}
      {tooltipPortal}
    </div>
  );
}

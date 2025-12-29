import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipPosition {
  top: number;
  left: number;
  arrowLeft: number;
}

interface FloatingTooltipProps {
  label: string;
  percentage: number;
  color?: string;
  children: React.ReactNode;
}

/**
 * FloatingTooltip - Reusable tooltip component that follows mouse hover
 * Uses React Portal to escape parent overflow:hidden constraints
 */
export function FloatingTooltip({
  label,
  percentage,
  color,
  children,
}: FloatingTooltipProps) {
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

  const calculatePosition = () => {
    if (!containerRef.current || !tooltipRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const padding = 16;

    // Calculate ideal center position
    let left =
      containerRect.left + containerRect.width / 2 - tooltipRect.width / 2;
    let arrowLeft = tooltipRect.width / 2;

    // Clamp to viewport bounds with padding
    if (left < padding) {
      // Tooltip would overflow left - align to left edge
      arrowLeft = containerRect.left + containerRect.width / 2 - padding;
      left = padding;
    } else if (left + tooltipRect.width > viewportWidth - padding) {
      // Tooltip would overflow right - align to right edge
      const newLeft = viewportWidth - padding - tooltipRect.width;
      arrowLeft = containerRect.left + containerRect.width / 2 - newLeft;
      left = newLeft;
    }

    // Ensure arrow stays within tooltip bounds
    arrowLeft = Math.max(12, Math.min(arrowLeft, tooltipRect.width - 12));

    const top = containerRect.top - tooltipRect.height - 8 + window.scrollY;

    setTooltipPosition({ top, left, arrowLeft });
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
    // Calculate position after tooltip becomes visible
    requestAnimationFrame(() => {
      calculatePosition();
    });
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    setTooltipPosition(null);
  };

  // Cleanup on unmount to ensure tooltip is hidden
  useEffect(() => {
    return () => {
      setIsVisible(false);
      setTooltipPosition(null);
    };
  }, []);

  // Hide tooltip if component re-renders while visible (e.g., data update)
  useEffect(() => {
    if (isVisible && containerRef.current) {
      // Recalculate position if still visible after re-render
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  });

  const tooltipContent = isVisible && isMounted && (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] px-3 py-2 text-sm rounded-lg shadow-xl pointer-events-none whitespace-nowrap"
      style={{
        top: tooltipPosition?.top ?? -9999,
        left: tooltipPosition?.left ?? -9999,
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        border: `1px solid ${color || "rgba(75, 85, 99, 0.5)"}`,
        visibility: tooltipPosition ? "visible" : "hidden",
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-bold" style={{ color: color || "#10b981" }}>
          {label}
        </span>
        <span className="text-gray-400 font-mono text-xs">
          {percentage.toFixed(2)}%
        </span>
      </div>
      {/* Tooltip arrow */}
      <div
        className="absolute w-2 h-2"
        style={{
          bottom: "-5px",
          left: tooltipPosition?.arrowLeft ?? 0,
          transform: "translateX(-50%) rotate(45deg)",
          backgroundColor: "rgba(17, 24, 39, 0.95)",
          borderRight: `1px solid ${color || "rgba(75, 85, 99, 0.5)"}`,
          borderBottom: `1px solid ${color || "rgba(75, 85, 99, 0.5)"}`,
        }}
      />
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseOut={handleMouseLeave}
    >
      {children}
      {isMounted &&
        tooltipContent &&
        createPortal(tooltipContent, document.body)}
    </div>
  );
}

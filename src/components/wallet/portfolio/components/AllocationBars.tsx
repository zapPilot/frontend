import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { AllocationConstituent } from "@/types/portfolio-allocation";

interface AllocationBarsProps {
  cryptoAssets: AllocationConstituent[];
  cryptoPercentage: number;
  stablePercentage: number;
}

// Threshold below which we hide inline text and show tooltip instead
const MIN_PERCENTAGE_FOR_LABEL = 8;

interface TooltipProps {
  label: string;
  percentage: number;
  color?: string;
  children: React.ReactNode;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowLeft: number;
}

/**
 * Simple tooltip component for small allocation bars
 * Uses React Portal to escape parent overflow:hidden constraints
 */
function AllocationTooltip({
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

/**
 * AllocationBars - Reusable visualization component for portfolio allocation
 *
 * Displays crypto and stable asset allocation as interactive animated bars.
 * Uses absolute portfolio percentages directly from API.
 *
 * For small allocations (< 8%), text is hidden and shown in a tooltip on hover.
 *
 * @param cryptoAssets - Array of crypto assets with symbols, absolute % values, and colors
 * @param cryptoPercentage - (deprecated, kept for compatibility) Total crypto allocation percentage
 * @param stablePercentage - Total stablecoins allocation percentage (0-100)
 */
export function AllocationBars({
  cryptoAssets,
  stablePercentage,
}: AllocationBarsProps) {
  return (
    <>
      {/* Crypto Section - Each asset bar uses its absolute percentage as width */}
      {cryptoAssets.map(asset => {
        const isSmall = asset.value < MIN_PERCENTAGE_FOR_LABEL;

        const barContent = (
          <motion.div
            key={asset.symbol}
            data-testid={`composition-${asset.symbol.toLowerCase()}`}
            className="h-full w-full rounded-lg relative group overflow-hidden cursor-pointer"
            style={{
              backgroundColor: `${asset.color}20`,
              border: `1px solid ${asset.color}50`,
            }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            {!isSmall && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-bold text-white text-lg">
                  {asset.symbol}
                </span>
                <span className="text-xs text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {asset.value.toFixed(2)}%
                </span>
              </div>
            )}
          </motion.div>
        );

        return (
          <div
            key={asset.symbol}
            className="h-full"
            style={{ width: `${asset.value}%` }}
          >
            {isSmall ? (
              <AllocationTooltip
                label={asset.symbol}
                percentage={asset.value}
                color={asset.color}
              >
                {barContent}
              </AllocationTooltip>
            ) : (
              barContent
            )}
          </div>
        );
      })}

      {/* Stable Section - Only show if has value */}
      {stablePercentage > 0 &&
        (() => {
          const isSmall = stablePercentage < MIN_PERCENTAGE_FOR_LABEL;

          const stableBarContent = (
            <motion.div
              data-testid="composition-stables"
              className="h-full w-full rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative group cursor-pointer"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              {!isSmall && (
                <div className="text-center">
                  <span className="font-bold text-emerald-400 text-lg">
                    STABLES
                  </span>
                  <div className="text-xs text-emerald-500/60 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {stablePercentage.toFixed(2)}%
                  </div>
                </div>
              )}
            </motion.div>
          );

          return (
            <div className="h-full" style={{ width: `${stablePercentage}%` }}>
              {isSmall ? (
                <AllocationTooltip
                  label="STABLES"
                  percentage={stablePercentage}
                  color="#10b981"
                >
                  {stableBarContent}
                </AllocationTooltip>
              ) : (
                stableBarContent
              )}
            </div>
          );
        })()}
    </>
  );
}

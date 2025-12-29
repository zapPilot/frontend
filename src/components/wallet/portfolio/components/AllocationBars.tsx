import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ASSET_COLORS, getBarStyle } from "@/constants/assets";
import type { AllocationConstituent } from "@/types/portfolio-allocation";

import { AllocationLegend } from "./AllocationLegend";

interface AllocationBarsProps {
  cryptoAssets: AllocationConstituent[];
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

const STYLES = {
  container: "flex flex-col gap-1",
  barsContainer: "h-20 w-full flex gap-1",
} as const;

/**
 * AllocationBars - Displays crypto and stable allocation as interactive animated bars
 */
export function AllocationBars({
  cryptoAssets,
  stablePercentage,
}: AllocationBarsProps) {
  const legendItems = useMemo(() => {
    const items = cryptoAssets.map(asset => ({
      symbol: asset.symbol,
      percentage: asset.value,
      color: asset.color,
    }));

    if (stablePercentage > 0) {
      items.push({
        symbol: "Stables",
        percentage: stablePercentage,
        color: ASSET_COLORS.USDT,
      });
    }

    return items;
  }, [cryptoAssets, stablePercentage]);

  return (
    <div className={STYLES.container} data-testid="allocation-bars-container">
      <div className={STYLES.barsContainer}>
        {/* Crypto Section - Each asset bar uses its absolute percentage as width */}
        {cryptoAssets.map(asset => {
          const isSmall = asset.value < MIN_PERCENTAGE_FOR_LABEL;

          const barContent = (
            <motion.div
              key={asset.symbol}
              data-testid={`composition-${asset.symbol.toLowerCase()}`}
              className="h-full w-full rounded-lg relative group overflow-hidden cursor-pointer"
              style={getBarStyle(asset.color)}
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
            const stableColor = ASSET_COLORS.USDT;

            const stableBarContent = (
              <motion.div
                data-testid="composition-stables"
                className="h-full w-full rounded-lg flex items-center justify-center relative group cursor-pointer"
                style={getBarStyle(stableColor)}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                {!isSmall && (
                  <div className="text-center">
                    <span
                      className="font-bold text-lg"
                      style={{ color: stableColor }}
                    >
                      STABLES
                    </span>
                    <div
                      className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: `${stableColor}99` }}
                    >
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
                    color={stableColor}
                  >
                    {stableBarContent}
                  </AllocationTooltip>
                ) : (
                  stableBarContent
                )}
              </div>
            );
          })()}
      </div>
      <AllocationLegend items={legendItems} />
    </div>
  );
}

/**
 * TargetAllocationBar - Modular target allocation visualization
 *
 * Renders a bar showing target portfolio allocation split.
 * Supports 3 display variants:
 * - 'tooltip': Shows percentage on hover tooltip (default)
 * - 'legend': Shows inline labels below the bar
 * - 'expand': Bar expands on hover to show labels
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TargetAsset {
  symbol: string;
  percentage: number;
  color: string;
}

type TargetBarVariant = "tooltip" | "legend" | "expand";

interface TargetAllocationBarProps {
  assets: TargetAsset[];
  /** Display variant: 'tooltip' | 'legend' | 'expand' */
  variant?: TargetBarVariant;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowLeft: number;
}

const STYLES = {
  container: "flex flex-col gap-1",
  bar: "h-2 w-full rounded-full flex overflow-hidden opacity-40",
  barExpand:
    "h-2 w-full rounded-full flex overflow-hidden opacity-40 hover:h-6 hover:opacity-100 transition-all duration-200",
  segment: "h-full cursor-pointer transition-opacity hover:opacity-80",
  segmentExpand:
    "h-full flex items-center justify-center text-[8px] font-bold text-white/90 overflow-hidden transition-all duration-200",
  legend: "flex gap-3 text-[10px] text-gray-400 mt-1",
  legendItem: "flex items-center gap-1",
  legendDot: "w-2 h-2 rounded-full",
} as const;

/**
 * Tooltip wrapper for target allocation segments
 */
function TargetTooltip({
  label,
  percentage,
  color,
  children,
}: {
  label: string;
  percentage: number;
  color: string;
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const calculatePosition = () => {
    if (!containerRef.current || !tooltipRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const padding = 16;

    let left =
      containerRect.left + containerRect.width / 2 - tooltipRect.width / 2;
    let arrowLeft = tooltipRect.width / 2;

    if (left < padding) {
      arrowLeft = containerRect.left + containerRect.width / 2 - padding;
      left = padding;
    } else if (left + tooltipRect.width > viewportWidth - padding) {
      const newLeft = viewportWidth - padding - tooltipRect.width;
      arrowLeft = containerRect.left + containerRect.width / 2 - newLeft;
      left = newLeft;
    }

    arrowLeft = Math.max(12, Math.min(arrowLeft, tooltipRect.width - 12));
    const top = containerRect.top - tooltipRect.height - 8 + window.scrollY;

    setTooltipPosition({ top, left, arrowLeft });
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
    requestAnimationFrame(() => {
      calculatePosition();
    });
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    setTooltipPosition(null);
  };

  useEffect(() => {
    return () => {
      setIsVisible(false);
      setTooltipPosition(null);
    };
  }, []);

  const tooltipContent = isVisible && isMounted && (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] px-2 py-1 text-xs rounded-lg shadow-xl pointer-events-none whitespace-nowrap"
      style={{
        top: tooltipPosition?.top ?? -9999,
        left: tooltipPosition?.left ?? -9999,
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        border: `1px solid ${color}50`,
        visibility: tooltipPosition ? "visible" : "hidden",
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-bold" style={{ color }}>
          {label}
        </span>
        <span className="text-gray-400 font-mono text-[10px]">
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div
        className="absolute w-1.5 h-1.5"
        style={{
          bottom: "-4px",
          left: tooltipPosition?.arrowLeft ?? 0,
          transform: "translateX(-50%) rotate(45deg)",
          backgroundColor: "rgba(17, 24, 39, 0.95)",
          borderRight: `1px solid ${color}50`,
          borderBottom: `1px solid ${color}50`,
        }}
      />
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="h-full"
      style={{ width: `${percentage}%` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isMounted &&
        tooltipContent &&
        createPortal(tooltipContent, document.body)}
    </div>
  );
}

/**
 * Variant 1: Tooltip mode - shows popup on hover
 */
function TooltipVariant({ assets }: { assets: TargetAsset[] }) {
  return (
    <div className={STYLES.bar} data-testid="target-allocation-bar">
      {assets.map(asset => (
        <TargetTooltip
          key={asset.symbol}
          label={asset.symbol}
          percentage={asset.percentage}
          color={asset.color}
        >
          <div
            data-testid={`target-${asset.symbol.toLowerCase()}`}
            className={STYLES.segment}
            style={{ backgroundColor: asset.color }}
          />
        </TargetTooltip>
      ))}
    </div>
  );
}

/**
 * Variant 2: Legend mode - shows labels below the bar
 */
function LegendVariant({ assets }: { assets: TargetAsset[] }) {
  return (
    <div className={STYLES.container} data-testid="target-allocation-bar">
      <div className={STYLES.bar}>
        {assets.map(asset => (
          <div
            key={asset.symbol}
            data-testid={`target-${asset.symbol.toLowerCase()}`}
            style={{
              width: `${asset.percentage}%`,
              backgroundColor: asset.color,
            }}
          />
        ))}
      </div>
      <div className={STYLES.legend}>
        {assets.map(asset => (
          <div key={asset.symbol} className={STYLES.legendItem}>
            <div
              className={STYLES.legendDot}
              style={{ backgroundColor: asset.color }}
            />
            <span style={{ color: asset.color }}>{asset.symbol}</span>
            <span>{asset.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Variant 3: Expand mode - bar grows on hover to show labels
 */
function ExpandVariant({ assets }: { assets: TargetAsset[] }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${STYLES.bar} ${isHovered ? "!h-6 !opacity-100" : ""} transition-all duration-200 cursor-pointer`}
      data-testid="target-allocation-bar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {assets.map(asset => (
        <div
          key={asset.symbol}
          data-testid={`target-${asset.symbol.toLowerCase()}`}
          className="h-full flex items-center justify-center overflow-hidden transition-all duration-200"
          style={{
            width: `${asset.percentage}%`,
            backgroundColor: asset.color,
          }}
        >
          {isHovered && asset.percentage >= 10 && (
            <span className="text-[9px] font-bold text-white/90 whitespace-nowrap">
              {asset.symbol} {asset.percentage.toFixed(0)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Renders a horizontal bar split into segments based on asset percentages.
 * Each asset's width is proportional to its percentage of the total portfolio.
 *
 * Variants:
 * - 'tooltip': Hover shows floating popup with asset info
 * - 'legend': Static labels displayed below the bar
 * - 'expand': Bar grows on hover to reveal inline labels
 */
export function TargetAllocationBar({
  assets,
  variant = "legend",
}: TargetAllocationBarProps) {
  if (assets.length === 0) {
    return null;
  }

  switch (variant) {
    case "tooltip":
      return <TooltipVariant assets={assets} />;
    case "legend":
      return <LegendVariant assets={assets} />;
    case "expand":
      return <ExpandVariant assets={assets} />;
    default:
      return <LegendVariant assets={assets} />;
  }
}

/**
 * ChartIndicator Component
 *
 * Reusable indicator component for chart hover states with chart-specific styling.
 * Supports single circles, multi-colored circles, and flagged circles for recovery points.
 */

import { CHART_COLORS } from "@/constants/portfolio";
import { getDrawdownSeverity, getSharpeColor } from "@/lib/chartHoverUtils";
import {
  isAllocationHover,
  isDrawdownHover,
  isPerformanceHover,
  isSharpeHover,
  isUnderwaterHover,
  isVolatilityHover,
  type ChartHoverState,
} from "@/types/chartHover";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ChartIndicatorProps {
  /** Current hover state or null */
  hoveredPoint: ChartHoverState | null;
  /** Indicator variant based on chart type */
  variant?: "circle" | "multi-circle" | "flagged-circle";
  /** Custom radius for the indicator circle */
  radius?: number;
  /** Custom stroke width */
  strokeWidth?: number;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(Math.round(value));
}

function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

function formatDateLabel(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getIndicatorAriaLabel(hoveredPoint: ChartHoverState): string {
  const formattedDate = formatDateLabel(hoveredPoint.date);

  if (isPerformanceHover(hoveredPoint)) {
    return `Portfolio value on ${formattedDate} is ${formatCurrency(hoveredPoint.value)}.`;
  }

  if (isAllocationHover(hoveredPoint)) {
    const allocations = [
      { label: "BTC", value: hoveredPoint.btc },
      { label: "ETH", value: hoveredPoint.eth },
      { label: "Stablecoin", value: hoveredPoint.stablecoin },
      { label: "Altcoin", value: hoveredPoint.altcoin },
    ];

    const significantAllocations = allocations
      .filter(item => item.value >= 1)
      .map(item => `${item.label} ${formatPercent(item.value)}`)
      .join(", ");

    return significantAllocations
      ? `Allocation on ${formattedDate}: ${significantAllocations}.`
      : `Allocation on ${formattedDate} has minimal distribution across categories.`;
  }

  if (isDrawdownHover(hoveredPoint)) {
    const severity = getDrawdownSeverity(hoveredPoint.drawdown);
    return `Drawdown on ${formattedDate} is ${formatPercent(Math.abs(hoveredPoint.drawdown), 2)} with ${severity} severity.`;
  }

  if (isSharpeHover(hoveredPoint)) {
    return `Sharpe ratio on ${formattedDate} is ${hoveredPoint.sharpe.toFixed(2)}, rated ${hoveredPoint.interpretation}.`;
  }

  if (isVolatilityHover(hoveredPoint)) {
    return `Volatility on ${formattedDate} is ${formatPercent(hoveredPoint.volatility, 1)} with ${hoveredPoint.riskLevel} risk.`;
  }

  if (isUnderwaterHover(hoveredPoint)) {
    const recoveryText = hoveredPoint.isRecoveryPoint
      ? " and marks a recovery point"
      : "";
    return `Underwater level on ${formattedDate} is ${formatPercent(Math.abs(hoveredPoint.underwater), 2)} with status ${hoveredPoint.recoveryStatus}${recoveryText}.`;
  }

  return `Chart value on ${formattedDate}.`;
}

function IndicatorWrapper({
  hoveredPoint,
  children,
}: {
  hoveredPoint: ChartHoverState;
  children: ReactNode;
}) {
  const ariaLabel = getIndicatorAriaLabel(hoveredPoint);

  return (
    <g
      role="img"
      aria-label={ariaLabel}
      style={{ pointerEvents: "none" }}
      data-chart-type={hoveredPoint.chartType}
    >
      <title>{ariaLabel}</title>
      {children}
    </g>
  );
}

/**
 * Get color based on chart type
 */
function getIndicatorColor(chartType: string): string {
  switch (chartType) {
    case "performance":
      return "#8b5cf6"; // Purple
    case "allocation":
      return "#8b5cf6"; // Purple (base color, multi-circle has its own colors)
    case "drawdown":
      return "#f97316"; // Orange
    case "sharpe":
      return "#10b981"; // Green (default, can be dynamic)
    case "volatility":
      return "#f59e0b"; // Amber
    case "underwater":
      return "#ef4444"; // Red
    default:
      return "#8b5cf6"; // Purple fallback
  }
}

/**
 * Single circle indicator for most chart types with special effects
 */
function SingleCircleIndicator({
  hoveredPoint,
  radius = 6,
  strokeWidth = 2,
}: {
  hoveredPoint: ChartHoverState;
  radius: number;
  strokeWidth: number;
}) {
  let color = getIndicatorColor(hoveredPoint.chartType);

  // Dynamic color for Sharpe ratio
  if (hoveredPoint.chartType === "sharpe") {
    color = getSharpeColor(hoveredPoint.sharpe || 0);
  }

  // Check for high volatility (>25%)
  const isHighVolatility =
    hoveredPoint.chartType === "volatility" && hoveredPoint.volatility > 25;

  return (
    <IndicatorWrapper hoveredPoint={hoveredPoint}>
      {/* Main indicator circle */}
      <motion.circle
        cx={hoveredPoint.x}
        cy={hoveredPoint.y}
        r={radius}
        fill={color}
        stroke="#ffffff"
        strokeWidth={strokeWidth}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.2 }}
        className="drop-shadow-lg"
      />

      {/* Pulse animation for high volatility */}
      {isHighVolatility && (
        <motion.circle
          cx={hoveredPoint.x}
          cy={hoveredPoint.y}
          r={radius + 6}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}
    </IndicatorWrapper>
  );
}

/**
 * Multi-circle indicator for allocation chart
 * Shows stacked colored circles representing different asset categories
 */
function MultiCircleIndicator({
  hoveredPoint,
  radius = 6,
  strokeWidth = 2,
}: {
  hoveredPoint: ChartHoverState;
  radius: number;
  strokeWidth: number;
}) {
  if (hoveredPoint.chartType !== "allocation") {
    return (
      <SingleCircleIndicator
        hoveredPoint={hoveredPoint}
        radius={radius}
        strokeWidth={strokeWidth}
      />
    );
  }

  const colors = [
    { value: hoveredPoint.btc, color: CHART_COLORS.btc },
    { value: hoveredPoint.eth, color: CHART_COLORS.eth },
    { value: hoveredPoint.stablecoin, color: CHART_COLORS.stablecoin },
    { value: hoveredPoint.altcoin, color: CHART_COLORS.altcoin },
  ];

  // Filter to only show significant allocations
  const significantColors = colors.filter(({ value }) => value > 1);

  // If only one significant allocation, show single circle
  if (significantColors.length === 1 && significantColors[0]) {
    return (
      <IndicatorWrapper hoveredPoint={hoveredPoint}>
        <motion.circle
          cx={hoveredPoint.x}
          cy={hoveredPoint.y}
          r={radius}
          fill={significantColors[0].color}
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.2 }}
          className="drop-shadow-lg"
        />
      </IndicatorWrapper>
    );
  }

  // Multiple allocations - show stacked circles
  return (
    <IndicatorWrapper hoveredPoint={hoveredPoint}>
      {significantColors.slice(0, 3).map((item, index) => (
        <motion.circle
          key={index}
          cx={hoveredPoint.x + index * 3}
          cy={hoveredPoint.y - index * 3}
          r={radius - index * 0.5}
          fill={item.color}
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className="drop-shadow-lg"
        />
      ))}
    </IndicatorWrapper>
  );
}

/**
 * Flagged circle indicator for underwater chart
 * Shows recovery points with a green flag
 */
function FlaggedCircleIndicator({
  hoveredPoint,
  radius = 6,
  strokeWidth = 2,
}: {
  hoveredPoint: ChartHoverState;
  radius: number;
  strokeWidth: number;
}) {
  const color = getIndicatorColor(hoveredPoint.chartType);
  const isRecoveryPoint =
    hoveredPoint.chartType === "underwater"
      ? hoveredPoint.isRecoveryPoint
      : false;

  return (
    <IndicatorWrapper hoveredPoint={hoveredPoint}>
      {/* Main circle */}
      <motion.circle
        cx={hoveredPoint.x}
        cy={hoveredPoint.y}
        r={radius}
        fill={color}
        stroke="#ffffff"
        strokeWidth={strokeWidth}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.2 }}
        className="drop-shadow-lg"
      />

      {/* Recovery flag */}
      {isRecoveryPoint && (
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          {/* Flag pole */}
          <line
            x1={hoveredPoint.x}
            y1={hoveredPoint.y - radius}
            x2={hoveredPoint.x}
            y2={hoveredPoint.y - radius - 12}
            stroke="#10b981"
            strokeWidth="2"
          />
          {/* Flag */}
          <path
            d={`M ${hoveredPoint.x} ${hoveredPoint.y - radius - 12} L ${hoveredPoint.x + 8} ${hoveredPoint.y - radius - 9} L ${hoveredPoint.x} ${hoveredPoint.y - radius - 6} Z`}
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="1"
          />
        </motion.g>
      )}
    </IndicatorWrapper>
  );
}

/**
 * ChartIndicator component
 * Renders the appropriate indicator based on chart type and variant
 */
export function ChartIndicator({
  hoveredPoint,
  variant = "circle",
  radius = 6,
  strokeWidth = 2,
}: ChartIndicatorProps) {
  if (!hoveredPoint) return null;

  // Auto-detect variant from chart type if not specified
  let effectiveVariant = variant;
  if (variant === "circle") {
    if (hoveredPoint.chartType === "allocation") {
      effectiveVariant = "multi-circle";
    } else if (hoveredPoint.chartType === "underwater") {
      effectiveVariant = "flagged-circle";
    }
  }

  switch (effectiveVariant) {
    case "multi-circle":
      return (
        <MultiCircleIndicator
          hoveredPoint={hoveredPoint}
          radius={radius}
          strokeWidth={strokeWidth}
        />
      );
    case "flagged-circle":
      return (
        <FlaggedCircleIndicator
          hoveredPoint={hoveredPoint}
          radius={radius}
          strokeWidth={strokeWidth}
        />
      );
    default:
      return (
        <SingleCircleIndicator
          hoveredPoint={hoveredPoint}
          radius={radius}
          strokeWidth={strokeWidth}
        />
      );
  }
}

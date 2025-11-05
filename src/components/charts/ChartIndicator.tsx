/**
 * ChartIndicator Component
 *
 * Reusable indicator component for chart hover states with chart-specific styling.
 * Supports single circles, multi-colored circles, and flagged circles for recovery points.
 */

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { CHART_COLORS } from "@/constants/portfolio";
import { getDrawdownSeverity, getSharpeColor } from "@/lib/chartHoverUtils";
import { formatters } from "@/lib/formatters";
import {
  type ChartHoverState,
  isAllocationHover,
  isDrawdownHover,
  isPerformanceHover,
  isSharpeHover,
  isVolatilityHover,
} from "@/types/chartHover";

const DEFAULT_INDICATOR_COLOR = "#8b5cf6" as const;
const INDICATOR_COLOR_MAP: Record<string, string> = {
  performance: DEFAULT_INDICATOR_COLOR,
  allocation: DEFAULT_INDICATOR_COLOR,
  "drawdown-recovery": "#f97316",
  sharpe: "#10b981",
  volatility: "#f59e0b",
};

const MULTI_CIRCLE_VARIANT = "multi-circle" as const;
const FLAGGED_CIRCLE_VARIANT = "flagged-circle" as const;
const DRAWDOWN_CHART_TYPE = "drawdown-recovery" as const;

const BASE_CIRCLE_ANIMATION = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
  transition: { duration: 0.2 },
} as const;

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

function getIndicatorAriaLabel(hoveredPoint: ChartHoverState): string {
  const formattedDate = formatters.chartDate(hoveredPoint.date);

  if (isPerformanceHover(hoveredPoint)) {
    return `Portfolio value on ${formattedDate} is ${formatters.currency(hoveredPoint.value)}.`;
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
      .map(item => `${item.label} ${formatters.percent(item.value)}`)
      .join(", ");

    return significantAllocations
      ? `Allocation on ${formattedDate}: ${significantAllocations}.`
      : `Allocation on ${formattedDate} has minimal distribution across categories.`;
  }

  if (isDrawdownHover(hoveredPoint)) {
    const severity = getDrawdownSeverity(hoveredPoint.drawdown);
    const recoveryText = hoveredPoint.isRecoveryPoint
      ? " and marks a new peak"
      : "";
    return `Drawdown on ${formattedDate} is ${formatters.percent(Math.abs(hoveredPoint.drawdown), 2)} with ${severity} severity${recoveryText}.`;
  }

  if (isSharpeHover(hoveredPoint)) {
    return `Sharpe ratio on ${formattedDate} is ${hoveredPoint.sharpe.toFixed(2)}, rated ${hoveredPoint.interpretation}.`;
  }

  if (isVolatilityHover(hoveredPoint)) {
    return `Volatility on ${formattedDate} is ${formatters.percent(hoveredPoint.volatility)} with ${hoveredPoint.riskLevel} risk.`;
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
  return INDICATOR_COLOR_MAP[chartType] ?? DEFAULT_INDICATOR_COLOR;
}

interface IndicatorCircleProps {
  hoveredPoint: ChartHoverState;
  radius: number;
  strokeWidth: number;
  fill: string;
  delay?: number;
  offsetX?: number;
  offsetY?: number;
  className?: string;
}

function IndicatorCircle({
  hoveredPoint,
  radius,
  strokeWidth,
  fill,
  delay = 0,
  offsetX = 0,
  offsetY = 0,
  className,
}: IndicatorCircleProps) {
  return (
    <motion.circle
      cx={hoveredPoint.x + offsetX}
      cy={hoveredPoint.y + offsetY}
      r={radius}
      fill={fill}
      stroke="#ffffff"
      strokeWidth={strokeWidth}
      initial={BASE_CIRCLE_ANIMATION.initial}
      animate={BASE_CIRCLE_ANIMATION.animate}
      exit={BASE_CIRCLE_ANIMATION.exit}
      transition={{ ...BASE_CIRCLE_ANIMATION.transition, delay }}
      className={className ? `drop-shadow-lg ${className}` : "drop-shadow-lg"}
    />
  );
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
      <IndicatorCircle
        hoveredPoint={hoveredPoint}
        radius={radius}
        strokeWidth={strokeWidth}
        fill={color}
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
        <IndicatorCircle
          hoveredPoint={hoveredPoint}
          radius={radius}
          strokeWidth={strokeWidth}
          fill={significantColors[0].color}
        />
      </IndicatorWrapper>
    );
  }

  // Multiple allocations - show stacked circles
  return (
    <IndicatorWrapper hoveredPoint={hoveredPoint}>
      {significantColors.slice(0, 3).map((item, index) => (
        <IndicatorCircle
          key={index}
          hoveredPoint={hoveredPoint}
          radius={radius - index * 0.5}
          strokeWidth={strokeWidth}
          fill={item.color}
          offsetX={index * 3}
          offsetY={-index * 3}
          delay={index * 0.05}
        />
      ))}
    </IndicatorWrapper>
  );
}

/**
 * Flagged circle indicator for recovery markers
 * Highlights new peaks with a green flag on the baseline
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
    hoveredPoint.chartType === DRAWDOWN_CHART_TYPE &&
    Boolean(hoveredPoint.isRecoveryPoint);

  return (
    <IndicatorWrapper hoveredPoint={hoveredPoint}>
      {/* Main circle */}
      <IndicatorCircle
        hoveredPoint={hoveredPoint}
        radius={radius}
        strokeWidth={strokeWidth}
        fill={color}
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
      effectiveVariant = MULTI_CIRCLE_VARIANT;
    } else if (
      hoveredPoint.chartType === DRAWDOWN_CHART_TYPE &&
      hoveredPoint.isRecoveryPoint
    ) {
      effectiveVariant = FLAGGED_CIRCLE_VARIANT;
    }
  }

  switch (effectiveVariant) {
    case MULTI_CIRCLE_VARIANT:
      return (
        <MultiCircleIndicator
          hoveredPoint={hoveredPoint}
          radius={radius}
          strokeWidth={strokeWidth}
        />
      );
    case FLAGGED_CIRCLE_VARIANT:
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

/**
 * ChartIndicator Component
 * Reusable indicator component for chart hover states with chart-specific styling.
 */

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { CHART_COLORS } from "@/constants/portfolio";
import {
  type ChartHoverState,
  isAllocationHover,
  isDrawdownHover,
  isPerformanceHover,
  isSharpeHover,
  isVolatilityHover,
} from "@/types/ui/chartHover";
import { getDrawdownSeverity, getSharpeColor } from "@/utils/chartHoverUtils";
import { formatters } from "@/utils/formatters";

const DEFAULT_COLOR = "#8b5cf6";
const COLOR_MAP: Record<string, string> = {
  performance: DEFAULT_COLOR,
  "asset-allocation": DEFAULT_COLOR,
  "drawdown-recovery": "#f97316",
  sharpe: "#10b981",
  volatility: "#f59e0b",
};

const CIRCLE_ANIMATION = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
  transition: { duration: 0.2 },
} as const;

interface ChartIndicatorProps {
  hoveredPoint: ChartHoverState | null;
  variant?: "circle" | "multi-circle" | "flagged-circle";
  radius?: number;
  strokeWidth?: number;
}

type IndicatorVariant = NonNullable<ChartIndicatorProps["variant"]>;

// =============================================================================
// HELPERS
// =============================================================================

function getAriaLabel(point: ChartHoverState): string {
  const date = formatters.chartDate(point.date);

  if (isPerformanceHover(point)) {
    return `Portfolio value on ${date} is ${formatters.currency(point.value)}.`;
  }

  if (isAllocationHover(point)) {
    const items = [
      { l: "BTC", v: point.btc },
      { l: "ETH", v: point.eth },
      { l: "Stablecoin", v: point.stablecoin },
      { l: "Altcoin", v: point.altcoin },
    ];
    const text = items
      .filter(i => i.v >= 1)
      .map(i => `${i.l} ${formatters.percent(i.v)}`)
      .join(", ");
    if (text) {
      return `Allocation on ${date}: ${text}.`;
    }

    return `Allocation on ${date} minimal.`;
  }

  if (isDrawdownHover(point)) {
    const severity = getDrawdownSeverity(point.drawdown);
    const recovery = point.isRecoveryPoint ? " and marks a new peak" : "";
    return `Drawdown on ${date} is ${formatters.percent(Math.abs(point.drawdown), 2)} with ${severity} severity${recovery}.`;
  }

  if (isSharpeHover(point)) {
    return `Sharpe ratio on ${date} is ${point.sharpe.toFixed(2)}, rated ${point.interpretation}.`;
  }

  if (isVolatilityHover(point)) {
    return `Volatility on ${date} is ${formatters.percent(point.volatility)} with ${point.riskLevel} risk.`;
  }

  return `Chart value on ${date}.`;
}

function getIndicatorColor(chartType: string): string {
  return COLOR_MAP[chartType] ?? DEFAULT_COLOR;
}

function resolveIndicatorVariant(
  variant: IndicatorVariant,
  hoveredPoint: ChartHoverState
): IndicatorVariant {
  if (variant !== "circle") {
    return variant;
  }

  if (hoveredPoint.chartType === "asset-allocation") {
    return "multi-circle";
  }

  if (
    hoveredPoint.chartType === "drawdown-recovery" &&
    hoveredPoint.isRecoveryPoint
  ) {
    return "flagged-circle";
  }

  return "circle";
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function IndicatorWrapper({
  point,
  children,
}: {
  point: ChartHoverState;
  children: ReactNode;
}) {
  const label = getAriaLabel(point);
  return (
    <g
      role="img"
      aria-label={label}
      style={{ pointerEvents: "none" }}
      data-chart-type={point.chartType}
    >
      <title>{label}</title>
      {children}
    </g>
  );
}

function IndicatorCircle({
  point,
  r,
  sw,
  fill,
  delay = 0,
  dx = 0,
  dy = 0,
  className,
}: {
  point: ChartHoverState;
  r: number;
  sw: number;
  fill: string;
  delay?: number;
  dx?: number;
  dy?: number;
  className?: string;
}) {
  return (
    <motion.circle
      cx={point.x + dx}
      cy={point.y + dy}
      r={r}
      fill={fill}
      stroke="#ffffff"
      strokeWidth={sw}
      initial={CIRCLE_ANIMATION.initial}
      animate={CIRCLE_ANIMATION.animate}
      exit={CIRCLE_ANIMATION.exit}
      transition={{ ...CIRCLE_ANIMATION.transition, delay }}
      className={`drop-shadow-lg ${className ?? ""}`}
    />
  );
}

function SingleCircle({
  point,
  r,
  sw,
}: {
  point: ChartHoverState;
  r: number;
  sw: number;
}) {
  const color =
    point.chartType === "sharpe"
      ? getSharpeColor(point.sharpe || 0)
      : getIndicatorColor(point.chartType);

  const isHighVol = point.chartType === "volatility" && point.volatility > 25;

  return (
    <IndicatorWrapper point={point}>
      <IndicatorCircle point={point} r={r} sw={sw} fill={color} />
      {isHighVol && (
        <motion.circle
          cx={point.x}
          cy={point.y}
          r={r + 6}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </IndicatorWrapper>
  );
}

function MultiCircle({
  point,
  r,
  sw,
}: {
  point: ChartHoverState;
  r: number;
  sw: number;
}) {
  if (point.chartType !== "asset-allocation") {
    return <SingleCircle point={point} r={r} sw={sw} />;
  }

  const colors = [
    { v: point.btc, c: CHART_COLORS.btc },
    { v: point.eth, c: CHART_COLORS.eth },
    { v: point.stablecoin, c: CHART_COLORS.stablecoin },
    { v: point.altcoin, c: CHART_COLORS.altcoin },
  ].filter(i => i.v > 1);

  if (colors.length <= 1) {
    return (
      <IndicatorWrapper point={point}>
        <IndicatorCircle
          point={point}
          r={r}
          sw={sw}
          fill={colors[0]?.c ?? CHART_COLORS.btc}
        />
      </IndicatorWrapper>
    );
  }

  return (
    <IndicatorWrapper point={point}>
      {colors.slice(0, 3).map((item, i) => (
        <IndicatorCircle
          key={i}
          point={point}
          r={r - i * 0.5}
          sw={sw}
          fill={item.c}
          dx={i * 3}
          dy={-i * 3}
          delay={i * 0.05}
        />
      ))}
    </IndicatorWrapper>
  );
}

function FlaggedCircle({
  point,
  r,
  sw,
}: {
  point: ChartHoverState;
  r: number;
  sw: number;
}) {
  const color = getIndicatorColor(point.chartType);
  const isRecovery =
    point.chartType === "drawdown-recovery" && point.isRecoveryPoint;

  return (
    <IndicatorWrapper point={point}>
      <IndicatorCircle point={point} r={r} sw={sw} fill={color} />
      {isRecovery && (
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <line
            x1={point.x}
            y1={point.y - r}
            x2={point.x}
            y2={point.y - r - 12}
            stroke="#10b981"
            strokeWidth="2"
          />
          <path
            d={`M ${point.x} ${point.y - r - 12} L ${point.x + 8} ${point.y - r - 9} L ${point.x} ${point.y - r - 6} Z`}
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="1"
          />
        </motion.g>
      )}
    </IndicatorWrapper>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ChartIndicator({
  hoveredPoint,
  variant = "circle",
  radius = 6,
  strokeWidth = 2,
}: ChartIndicatorProps) {
  if (!hoveredPoint) {
    return null;
  }

  const effectiveVariant = resolveIndicatorVariant(variant, hoveredPoint);
  const props = { point: hoveredPoint, r: radius, sw: strokeWidth };

  switch (effectiveVariant) {
    case "multi-circle":
      return <MultiCircle {...props} />;
    case "flagged-circle":
      return <FlaggedCircle {...props} />;
    default:
      return <SingleCircle {...props} />;
  }
}

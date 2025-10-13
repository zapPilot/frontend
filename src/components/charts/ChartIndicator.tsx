/**
 * ChartIndicator Component
 *
 * Reusable indicator component for chart hover states with chart-specific styling.
 * Supports single circles, multi-colored circles, and flagged circles for recovery points.
 */

import { motion } from "framer-motion";
import type { ChartHoverState } from "../../types/chartHover";

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
      return "#ef4444"; // Red
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
 * Get dynamic Sharpe color based on value (5-level system)
 */
function getSharpeColor(sharpe: number): string {
  if (sharpe > 2.0) return "#10b981"; // Excellent - Green
  if (sharpe > 1.0) return "#84cc16"; // Good - Lime
  if (sharpe > 0.5) return "#eab308"; // Fair - Yellow
  if (sharpe > 0) return "#f97316"; // Poor - Orange
  return "#ef4444"; // Very Poor - Red
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
    <>
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
    </>
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
    { value: hoveredPoint.btc, color: "#f59e0b" }, // BTC - Amber
    { value: hoveredPoint.eth, color: "#6366f1" }, // ETH - Indigo
    { value: hoveredPoint.stablecoin, color: "#10b981" }, // Stablecoin - Green
    { value: hoveredPoint.defi, color: "#8b5cf6" }, // DeFi - Purple
    { value: hoveredPoint.altcoin, color: "#ef4444" }, // Altcoin - Red
  ];

  // Filter to only show significant allocations
  const significantColors = colors.filter(({ value }) => value > 1);

  // If only one significant allocation, show single circle
  if (significantColors.length === 1 && significantColors[0]) {
    return (
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
    );
  }

  // Multiple allocations - show stacked circles
  return (
    <g>
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
    </g>
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
    <g>
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
    </g>
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

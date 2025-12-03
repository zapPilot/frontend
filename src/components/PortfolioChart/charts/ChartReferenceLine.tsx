/**
 * ChartReferenceLine Component
 *
 * Reusable horizontal reference line for charts (e.g., zero baseline, average line)
 * Consolidates the duplicate dashed line pattern across chart components
 */

interface ChartReferenceLineProps {
  /** Y position of the line */
  y: number;
  /** Start X position (default: 0) */
  x1?: number;
  /** End X position */
  x2: number;
  /** Line color (default: gray) */
  stroke?: string;
  /** Line thickness (default: 1) */
  strokeWidth?: string | number;
  /** Dash pattern (default: "3,3") */
  strokeDasharray?: string;
  /** Line opacity (default: 0.5) */
  opacity?: string | number;
}

/**
 * Renders a horizontal reference line with consistent styling
 */
export function ChartReferenceLine({
  y,
  x1 = 0,
  x2,
  stroke = "#6b7280",
  strokeWidth = "1",
  strokeDasharray = "3,3",
  opacity = "0.5",
}: ChartReferenceLineProps) {
  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      opacity={opacity}
    />
  );
}

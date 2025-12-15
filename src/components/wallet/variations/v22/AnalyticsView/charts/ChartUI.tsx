/**
 * Reusable Chart UI Components
 *
 * Grid lines, labels, and other chart decorations
 */

import type { ReactNode } from "react";

/**
 * Reusable grid lines for charts
 */
export const ChartGridLines = ({ positions }: { positions: number[] }) => (
  <div className="absolute inset-0">
    {positions.map(y => (
      <div
        key={y}
        className="absolute w-full h-px bg-gray-800/40"
        style={{ top: `${y}%` }}
      />
    ))}
  </div>
);

/**
 * Reusable Y-axis labels for drawdown-style charts
 */
export const YAxisLabels = ({
  labels,
  alignment = "right",
}: {
  labels: string[];
  alignment?: "left" | "right";
}) => (
  <div
    className={`absolute ${alignment === "right" ? "right-2" : "left-2"} top-0 h-full flex flex-col justify-between py-1 text-[10px] text-gray-600 font-mono text-${alignment}`}
  >
    {labels.map((label, idx) => (
      <span key={idx}>{label}</span>
    ))}
  </div>
);

/**
 * Chart hover handlers interface
 */
export interface ChartHoverHandlers {
  handleMouseMove: (event: React.MouseEvent<SVGSVGElement>) => void;
  handleMouseLeave: (event?: React.MouseEvent<SVGSVGElement>) => void;
  handlePointerMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
  handleTouchMove: (event: React.TouchEvent<SVGSVGElement>) => void;
  handleTouchEnd: (event?: React.TouchEvent<SVGSVGElement>) => void;
}

/**
 * SVG surface for chart rendering with event handlers
 */
export const ChartSurface = ({
  width,
  height,
  handlers,
  children,
}: {
  width: number;
  height: number;
  handlers: ChartHoverHandlers;
  children: ReactNode;
}) => (
  <svg
    viewBox={`0 0 ${width} ${height}`}
    preserveAspectRatio="none"
    className="absolute inset-0 w-full h-full"
    onMouseMove={handlers.handleMouseMove}
    onMouseLeave={handlers.handleMouseLeave}
    onPointerMove={handlers.handlePointerMove}
    onPointerDown={handlers.handlePointerDown}
    onTouchMove={handlers.handleTouchMove}
    onTouchEnd={handlers.handleTouchEnd}
    style={{ touchAction: "none" }}
  >
    {children}
  </svg>
);

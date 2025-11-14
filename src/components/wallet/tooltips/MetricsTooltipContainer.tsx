/**
 * Shared container component for metrics tooltips
 * Provides consistent styling and portal rendering
 */

import React from "react";
import { createPortal } from "react-dom";

import { Z_INDEX } from "@/constants/design-system";

import type { TooltipPosition } from "./types";

interface MetricsTooltipContainerProps {
  position: TooltipPosition;
  children: React.ReactNode;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
}

/**
 * Reusable tooltip container with portal rendering
 *
 * Renders tooltip at specified position using createPortal for proper z-index layering.
 * Centers tooltip horizontally relative to trigger element.
 */
export function MetricsTooltipContainer({
  position,
  children,
  onMouseEnter,
  onMouseLeave,
  className = "",
}: MetricsTooltipContainerProps) {
  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
      className={`bg-gray-900 text-white text-xs rounded shadow-lg w-72 p-4 border border-gray-700 ${Z_INDEX.TOOLTIP} ${className}`.trim()}
    >
      {children}
    </div>,
    document.body
  );
}

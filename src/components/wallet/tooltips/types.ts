/**
 * Shared types for metrics tooltips
 */

export interface TooltipPosition {
  top: number;
  left: number;
}

export interface MetricsTooltipProps {
  position: TooltipPosition;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

import type { ReactNode } from "react";

import type { useMetricsTooltip } from "../tooltips";

interface YieldMetricWrapperProps {
  /** Enable interactive tooltip behavior */
  hasInteraction: boolean;
  /** Tooltip state and handlers from useMetricsTooltip */
  yieldTooltip: ReturnType<typeof useMetricsTooltip<HTMLDivElement>>;
  /** Content to render inside the wrapper */
  children: ReactNode;
}

/**
 * Wrapper component for YieldMetric that handles tooltip trigger logic.
 *
 * Extracted from YieldMetric to eliminate duplicate code for:
 * - Interactive div with tooltip trigger
 * - Keyboard accessibility (Enter/Space)
 * - ARIA attributes (role, tabIndex, aria-label)
 *
 * @example
 * ```tsx
 * <YieldMetricWrapper
 *   hasInteraction={hasProtocolBreakdown}
 *   yieldTooltip={yieldTooltip}
 * >
 *   <YieldMetricHeader ... />
 *   <YieldMetricValue ... />
 * </YieldMetricWrapper>
 * ```
 */
export function YieldMetricWrapper({
  hasInteraction,
  yieldTooltip,
  children,
}: YieldMetricWrapperProps) {
  return (
    <div
      className="relative"
      ref={hasInteraction ? yieldTooltip.triggerRef : undefined}
      onClick={hasInteraction ? yieldTooltip.toggle : undefined}
      onKeyDown={
        hasInteraction
          ? event => {
              if (
                event.key === "Enter" ||
                event.key === " " ||
                event.key === "Spacebar"
              ) {
                event.preventDefault();
                yieldTooltip.toggle();
              }
            }
          : undefined
      }
      role={hasInteraction ? "button" : undefined}
      tabIndex={hasInteraction ? 0 : undefined}
      aria-label={hasInteraction ? "Toggle yield breakdown" : undefined}
    >
      {children}
    </div>
  );
}

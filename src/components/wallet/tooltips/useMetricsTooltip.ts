/**
 * Custom hook for metrics tooltip positioning and visibility
 * Consolidates duplicate tooltip state management logic
 */

import { useCallback, useRef, useState } from "react";

import type { TooltipPosition } from "./types";

export interface UseMetricsTooltipReturn {
  visible: boolean;
  position: TooltipPosition;
  triggerRef: React.RefObject<HTMLSpanElement | null>;
  open: () => void;
  close: () => void;
}

/**
 * Hook for managing tooltip visibility and positioning
 *
 * @example
 * ```tsx
 * const tooltip = useMetricsTooltip();
 *
 * return (
 *   <>
 *     <span
 *       ref={tooltip.triggerRef}
 *       onMouseOver={tooltip.open}
 *       onMouseOut={tooltip.close}
 *     >
 *       <Info />
 *     </span>
 *     {tooltip.visible && <Tooltip position={tooltip.position} />}
 *   </>
 * );
 * ```
 */
export function useMetricsTooltip(): UseMetricsTooltipReturn {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement | null>(null);

  const open = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8 + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    });
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  return {
    visible,
    position,
    triggerRef,
    open,
    close,
  };
}

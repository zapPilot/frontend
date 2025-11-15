/**
 * Custom hook for metrics tooltip positioning and visibility
 * Consolidates duplicate tooltip state management logic
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { TooltipPosition } from "./types";

interface UseMetricsTooltipReturn<TTrigger extends HTMLElement> {
  visible: boolean;
  position: TooltipPosition;
  triggerRef: React.RefObject<TTrigger | null>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  toggle: () => void;
  close: () => void;
  open: () => void; // Keep open for programmatic control if needed
}

/**
 * Hook for managing a click-to-toggle tooltip
 */
export function useMetricsTooltip<
  TTrigger extends HTMLElement = HTMLElement,
>(): UseMetricsTooltipReturn<TTrigger> {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
  });
  const triggerRef = useRef<TTrigger | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

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

  const toggle = useCallback(() => {
    if (visible) {
      close();
    } else {
      open();
    }
  }, [visible, open, close]);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, close]);

  return {
    visible,
    position,
    triggerRef,
    tooltipRef,
    toggle,
    close,
    open,
  };
}

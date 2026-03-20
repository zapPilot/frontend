"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import type { SecondaryMetric } from "./backtestTerminalMetrics";
import { COLLAPSE_ANIMATION, phosphorGlowDimStyle } from "./terminalStyles";

export interface BacktestSecondaryMetricsProps {
  /** Whether backtest data is available (controls toggle visibility) */
  hasData: boolean;
  /** Secondary metric entries to display */
  metrics: SecondaryMetric[];
}

/**
 * Collapsible secondary metrics section with a terminal `show_metrics` toggle.
 * Owns its own `showMetrics` open/closed state.
 *
 * @param props - {@link BacktestSecondaryMetricsProps}
 * @returns Toggle prompt + collapsible metrics row
 *
 * @example
 * ```tsx
 * <BacktestSecondaryMetrics
 *   hasData={!!regime}
 *   metrics={createSecondaryMetrics(regime)}
 * />
 * ```
 */
export function BacktestSecondaryMetrics({
  hasData,
  metrics,
}: BacktestSecondaryMetricsProps): React.ReactElement | null {
  const [showMetrics, setShowMetrics] = useState(false);

  if (!hasData) {
    return null;
  }

  return (
    <>
      {/* Toggle prompt */}
      <div className="px-6 py-3 border-t border-gray-800">
        <button
          onClick={() => setShowMetrics(!showMetrics)}
          className="text-left w-full group"
        >
          <span className="text-emerald-400/60">{">"}</span>
          <span className="text-gray-400 ml-2">show_metrics</span>
          <span
            className="text-emerald-400 ml-0.5"
            style={{ animation: "blink 1s step-end infinite" }}
          >
            _
          </span>
          <span className="text-gray-500 ml-3">
            [{showMetrics ? "Y/n" : "y/N"}]
          </span>
        </button>
      </div>

      {/* Collapsible metrics row */}
      <AnimatePresence>
        {showMetrics && metrics.length > 0 && (
          <motion.div {...COLLAPSE_ANIMATION} className="overflow-hidden">
            <div className="px-6 py-3 flex flex-wrap items-center gap-x-1 text-sm">
              {metrics.map((m, i) => (
                <span key={m.label}>
                  {i > 0 && (
                    <span className="text-emerald-400/20 mx-2">{"\u2551"}</span>
                  )}
                  <span className="text-emerald-400/60">{m.label}</span>{" "}
                  <span
                    className="text-white font-bold"
                    style={phosphorGlowDimStyle}
                  >
                    {m.value}
                  </span>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

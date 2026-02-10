"use client";

/* jscpd:ignore-start */
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { BacktestChart } from "../BacktestChart";
import {
  buildMockSecondaryMetrics,
  COLLAPSE_ANIMATION,
  MOCK_CHART_DATA,
  MOCK_CONFIG_DEFAULTS,
  MOCK_SORTED_STRATEGY_IDS,
  MOCK_STRATEGIES,
  MOCK_Y_AXIS_DOMAIN,
  PHOSPHOR_GLOW,
  PHOSPHOR_GLOW_DIM,
} from "./mockData";
/* jscpd:ignore-end */

function asciiBar(value: number, max: number, width: number): string {
  const filled = Math.round((Math.min(Math.abs(value), max) / max) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

// Terminal: retro CLI aesthetic with monospace text, ASCII bars, and scan-line overlay
export function TerminalVariation(): React.ReactElement {
  const [showMetrics, setShowMetrics] = useState(false);
  const [days, setDays] = useState(MOCK_CONFIG_DEFAULTS.days);
  const [capital, setCapital] = useState(MOCK_CONFIG_DEFAULTS.capital);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const regime = MOCK_STRATEGIES["simple_regime"]!;

  const heroMetrics = [
    {
      label: "ROI",
      value: `+${regime.roi_percent.toFixed(1)}%`,
      bar: asciiBar(regime.roi_percent, 200, 10),
      color: "text-emerald-400",
    },
    {
      label: "CALMAR",
      value: regime.calmar_ratio?.toFixed(2) ?? "N/A",
      bar: asciiBar(regime.calmar_ratio ?? 0, 5, 10),
      color: "text-cyan-400",
    },
    {
      label: "MAX DRAWDOWN",
      value: `${regime.max_drawdown_percent?.toFixed(1)}%`,
      bar: asciiBar(Math.abs(regime.max_drawdown_percent ?? 0), 30, 10),
      color: "text-rose-400",
    },
  ];

  const secondaryMetrics = buildMockSecondaryMetrics(regime, true);

  return (
    <div className="font-mono bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Command prompt bar */}
      <div className="border-b border-gray-800 px-4 py-3 flex items-center gap-2 flex-wrap">
        <span
          className="text-emerald-400"
          style={{ textShadow: PHOSPHOR_GLOW }}
        >
          $
        </span>
        <span className="text-gray-300">backtest</span>
        <span className="text-gray-400">--days</span>
        <input
          type="number"
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="bg-transparent border-b border-emerald-400/30 text-emerald-400 w-16 text-center focus:outline-none"
          style={{ textShadow: PHOSPHOR_GLOW }}
        />
        <span className="text-gray-400">--capital</span>
        <input
          type="number"
          value={capital}
          onChange={e => setCapital(Number(e.target.value))}
          className="bg-transparent border-b border-emerald-400/30 text-emerald-400 w-20 text-center focus:outline-none"
          style={{ textShadow: PHOSPHOR_GLOW }}
        />
        <span className="text-gray-400">--strat</span>
        <span className="text-emerald-400">regime</span>
        <button
          className="ml-auto border border-emerald-400/30 text-emerald-400 px-3 py-1 rounded hover:bg-emerald-400/10 transition-colors text-sm"
          style={{ textShadow: PHOSPHOR_GLOW }}
        >
          [RUN]
        </button>
      </div>

      {/* Hero metrics section */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {heroMetrics.map((metric, index) => (
            <div
              key={metric.label}
              className={`px-4 py-3 border-t-2 border-emerald-400/20 ${
                index > 0 ? "md:border-l border-emerald-400/20" : ""
              }`}
            >
              <div
                className="text-xs text-emerald-400/60 uppercase tracking-widest mb-2"
                style={{ textShadow: PHOSPHOR_GLOW }}
              >
                {metric.label}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400/80 text-sm">{metric.bar}</span>
                <span
                  className={`text-xl font-bold ${metric.color}`}
                  style={{ textShadow: PHOSPHOR_GLOW }}
                >
                  {metric.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart section with scan-line overlay */}
      <div className="relative px-4 py-2">
        <BacktestChart
          chartData={MOCK_CHART_DATA}
          sortedStrategyIds={MOCK_SORTED_STRATEGY_IDS}
          yAxisDomain={MOCK_Y_AXIS_DOMAIN}
          actualDays={days}
          chartIdPrefix="terminal"
        />
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(52,211,153,0.03) 2px, rgba(52,211,153,0.03) 4px)",
          }}
        />
      </div>

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

      {/* Secondary metrics */}
      <AnimatePresence>
        {showMetrics && (
          <motion.div
            {...COLLAPSE_ANIMATION}
            className="overflow-hidden"
          >
            <div className="px-6 py-3 flex flex-wrap items-center gap-x-1 text-sm">
              {secondaryMetrics.map((m, i) => (
                <span key={m.label}>
                  {i > 0 && (
                    <span className="text-emerald-400/20 mx-2">║</span>
                  )}
                  <span className="text-emerald-400/60">{m.label}</span>{" "}
                  <span
                    className="text-white font-bold"
                    style={{ textShadow: PHOSPHOR_GLOW_DIM }}
                  >
                    {m.value}
                  </span>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

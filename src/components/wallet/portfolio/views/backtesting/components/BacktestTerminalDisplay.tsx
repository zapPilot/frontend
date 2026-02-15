"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import type { BacktestResponse } from "@/types/backtesting";

import {
  DEFAULT_DAYS,
  PACING_POLICY_OPTIONS,
  SIGNAL_PROVIDER_OPTIONS,
} from "../constants";
import { getPrimaryStrategyId } from "../utils/chartHelpers";
import {
  parseJsonField,
  parseRegimeParam,
  updateJsonField,
  updateRegimeParam,
} from "../utils/jsonConfigurationHelpers";
import { BacktestChart } from "./BacktestChart";
import {
  createHeroMetrics,
  createSecondaryMetrics,
} from "./backtestTerminalMetrics";

const PHOSPHOR_GLOW = "0 0 8px rgba(52,211,153,0.6)";
const PHOSPHOR_GLOW_DIM = "0 0 8px rgba(52,211,153,0.4)";
const phosphorGlowStyle = { textShadow: PHOSPHOR_GLOW } as const;
const phosphorGlowDimStyle = { textShadow: PHOSPHOR_GLOW_DIM } as const;

const COLLAPSE_ANIMATION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto" as const, opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

function TerminalOptionList({
  options,
}: {
  options: readonly { readonly value: string; readonly label: string }[];
}) {
  return (
    <>
      {options.map(opt => (
        <option
          key={opt.value}
          value={opt.value}
          className="bg-gray-900 text-emerald-400"
        >
          {opt.label}
        </option>
      ))}
    </>
  );
}

export interface BacktestTerminalDisplayProps {
  /** Strategy summaries keyed by strategy_id */
  summary: { strategies: BacktestResponse["strategies"] } | null;
  /** Strategy IDs in display order */
  sortedStrategyIds: string[];
  /** Actual number of simulated days */
  actualDays: number;
  /** Chart timeline data */
  chartData: Record<string, unknown>[];
  /** Y-axis domain for chart */
  yAxisDomain: [number, number];
  /** Whether a backtest is currently running */
  isPending: boolean;
  /** Trigger a new backtest run */
  onRun: () => void;
  /** Raw JSON editor value (contains days / total_capital) */
  editorValue: string;
  /** Update the JSON editor value */
  onEditorValueChange: (v: string) => void;
}

/**
 * Terminal-themed backtesting results display with a retro CLI aesthetic,
 * monospace text, ASCII bars, and a scan-line overlay.
 */
export function BacktestTerminalDisplay({
  summary,
  sortedStrategyIds,
  actualDays,
  chartData,
  yAxisDomain,
  isPending,
  onRun,
  editorValue,
  onEditorValueChange,
}: BacktestTerminalDisplayProps): React.ReactElement {
  const [showMetrics, setShowMetrics] = useState(false);

  const days = parseJsonField(editorValue, "days", DEFAULT_DAYS);
  const signalProvider = parseRegimeParam(editorValue, "signal_provider", "");
  const pacingPolicy = parseRegimeParam(
    editorValue,
    "pacing_policy",
    "fgi_exponential"
  );

  const primaryId = getPrimaryStrategyId(sortedStrategyIds);
  const regime = primaryId ? summary?.strategies[primaryId] : undefined;

  const heroMetrics = useMemo(() => createHeroMetrics(regime), [regime]);
  const secondaryMetrics = useMemo(
    () => createSecondaryMetrics(regime),
    [regime]
  );

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEditorValueChange(
      updateJsonField(editorValue, "days", Number(e.target.value))
    );
  };

  const handleSignalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onEditorValueChange(
      updateRegimeParam(editorValue, "signal_provider", e.target.value)
    );
  };
  const handlePacingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onEditorValueChange(
      updateRegimeParam(editorValue, "pacing_policy", e.target.value)
    );
  };

  return (
    <div className="font-mono bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Command prompt bar */}
      <div className="border-b border-gray-800 px-4 py-3 flex items-center gap-2 flex-wrap">
        <span className="text-emerald-400" style={phosphorGlowStyle}>
          $
        </span>
        <span className="text-gray-300">backtest</span>
        <span className="text-gray-400">--days</span>
        <input
          type="number"
          value={days}
          onChange={handleDaysChange}
          className="bg-transparent border-b border-emerald-400/30 text-emerald-400 w-16 text-center focus:outline-none"
          style={phosphorGlowStyle}
        />
        <span className="text-gray-400">--signal</span>
        <select
          value={signalProvider}
          onChange={handleSignalChange}
          className="bg-transparent border-b border-emerald-400/30 text-emerald-400 focus:outline-none appearance-none cursor-pointer text-center"
          style={phosphorGlowStyle}
        >
          <TerminalOptionList options={SIGNAL_PROVIDER_OPTIONS} />
        </select>
        <span className="text-gray-400">--pacing</span>
        <select
          value={pacingPolicy}
          onChange={handlePacingChange}
          className="bg-transparent border-b border-emerald-400/30 text-emerald-400 focus:outline-none appearance-none cursor-pointer text-center"
          style={phosphorGlowStyle}
        >
          <TerminalOptionList options={PACING_POLICY_OPTIONS} />
        </select>
        <button
          onClick={onRun}
          disabled={isPending}
          className="ml-auto border border-emerald-400/30 text-emerald-400 px-3 py-1 rounded hover:bg-emerald-400/10 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          style={phosphorGlowStyle}
        >
          {isPending ? "[...]" : "[RUN]"}
        </button>
      </div>

      {/* Hero metrics section */}
      {heroMetrics.length > 0 && (
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
                  style={phosphorGlowStyle}
                >
                  {metric.label}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400/80 text-sm">
                    {metric.bar}
                  </span>
                  <span
                    className={`text-xl font-bold ${metric.color}`}
                    style={phosphorGlowStyle}
                  >
                    {metric.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart section with scan-line overlay */}
      {chartData.length > 0 && (
        <div className="relative px-4 py-2">
          <BacktestChart
            chartData={chartData}
            sortedStrategyIds={sortedStrategyIds}
            yAxisDomain={yAxisDomain}
            actualDays={actualDays}
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
      )}

      {/* Toggle prompt */}
      {regime && (
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
      )}

      {/* Secondary metrics */}
      <AnimatePresence>
        {showMetrics && secondaryMetrics.length > 0 && (
          <motion.div {...COLLAPSE_ANIMATION} className="overflow-hidden">
            <div className="px-6 py-3 flex flex-wrap items-center gap-x-1 text-sm">
              {secondaryMetrics.map((m, i) => (
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
    </div>
  );
}

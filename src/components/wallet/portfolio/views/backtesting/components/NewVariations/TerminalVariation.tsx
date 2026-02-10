"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import type {
  BacktestResponse,
  BacktestStrategySummary,
} from "@/types/backtesting";

import { BacktestChart } from "../BacktestChart";

// ─── Terminal visual constants ───────────────────────────────────────

const PHOSPHOR_GLOW = "0 0 8px rgba(52,211,153,0.6)";
const PHOSPHOR_GLOW_DIM = "0 0 8px rgba(52,211,153,0.4)";

const COLLAPSE_ANIMATION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto" as const, opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

// ─── Props ───────────────────────────────────────────────────────────

export interface TerminalVariationProps {
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

// ─── Helpers ─────────────────────────────────────────────────────────

function asciiBar(value: number, max: number, width: number): string {
  const filled = Math.round((Math.min(Math.abs(value), max) / max) * width);
  const empty = width - filled;
  return "\u2588".repeat(filled) + "\u2591".repeat(empty);
}

interface SecondaryMetric {
  label: string;
  value: string;
}

function buildSecondaryMetrics(
  strategy: BacktestStrategySummary
): SecondaryMetric[] {
  return [
    { label: "SHARPE", value: strategy.sharpe_ratio?.toFixed(2) ?? "N/A" },
    { label: "SORTINO", value: strategy.sortino_ratio?.toFixed(2) ?? "N/A" },
    {
      label: "VOL",
      value: strategy.volatility
        ? `${(strategy.volatility * 100).toFixed(1)}%`
        : "N/A",
    },
    { label: "BETA", value: strategy.beta?.toFixed(2) ?? "N/A" },
    {
      label: "FINAL",
      value: `$${strategy.final_value.toLocaleString()}`,
    },
  ];
}

/**
 * Parse a numeric field from the JSON editor value string.
 * Returns `fallback` when the JSON is invalid or the key is missing.
 */
function parseJsonField(json: string, key: string, fallback: number): number {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const val = parsed[key];
    return typeof val === "number" ? val : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Update a single numeric field inside the JSON editor value and return
 * the new JSON string.  Preserves all other fields.
 */
function updateJsonField(json: string, key: string, value: number): string {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    parsed[key] = value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return json;
  }
}

// ─── Component ───────────────────────────────────────────────────────

/**
 * Terminal-themed backtesting results display with a retro CLI aesthetic,
 * monospace text, ASCII bars, and a scan-line overlay.
 */
export function TerminalVariation({
  summary,
  sortedStrategyIds,
  actualDays,
  chartData,
  yAxisDomain,
  isPending,
  onRun,
  editorValue,
  onEditorValueChange,
}: TerminalVariationProps): React.ReactElement {
  const [showMetrics, setShowMetrics] = useState(false);

  const days = parseJsonField(editorValue, "days", 500);
  const capital = parseJsonField(editorValue, "total_capital", 10000);

  const primaryId =
    sortedStrategyIds.find(id => id !== "dca_classic") ?? sortedStrategyIds[0];
  const regime = primaryId ? summary?.strategies[primaryId] : undefined;

  const heroMetrics = useMemo(() => {
    if (!regime) return [];
    return [
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
  }, [regime]);

  const secondaryMetrics = useMemo(() => {
    if (!regime) return [];
    return buildSecondaryMetrics(regime);
  }, [regime]);

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEditorValueChange(
      updateJsonField(editorValue, "days", Number(e.target.value))
    );
  };

  const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEditorValueChange(
      updateJsonField(editorValue, "total_capital", Number(e.target.value))
    );
  };

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
          onChange={handleDaysChange}
          className="bg-transparent border-b border-emerald-400/30 text-emerald-400 w-16 text-center focus:outline-none"
          style={{ textShadow: PHOSPHOR_GLOW }}
        />
        <span className="text-gray-400">--capital</span>
        <input
          type="number"
          value={capital}
          onChange={handleCapitalChange}
          className="bg-transparent border-b border-emerald-400/30 text-emerald-400 w-20 text-center focus:outline-none"
          style={{ textShadow: PHOSPHOR_GLOW }}
        />
        <span className="text-gray-400">--strat</span>
        <span className="text-emerald-400">regime</span>
        <button
          onClick={onRun}
          disabled={isPending}
          className="ml-auto border border-emerald-400/30 text-emerald-400 px-3 py-1 rounded hover:bg-emerald-400/10 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ textShadow: PHOSPHOR_GLOW }}
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
                  style={{ textShadow: PHOSPHOR_GLOW }}
                >
                  {metric.label}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400/80 text-sm">
                    {metric.bar}
                  </span>
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

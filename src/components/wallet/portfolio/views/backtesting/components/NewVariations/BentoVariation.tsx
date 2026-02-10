"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, Settings } from "lucide-react";
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
} from "./mockData";

// Bento: geometric CSS grid with config, chart, and metrics as uniform cells
export function BentoVariation(): React.ReactElement {
  const [showDetails, setShowDetails] = useState(false);
  const [config, setConfig] = useState(MOCK_CONFIG_DEFAULTS);

  // Derive metrics from MOCK_STRATEGIES
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const regime = MOCK_STRATEGIES["simple_regime"]!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dca = MOCK_STRATEGIES["dca_classic"]!;
  const roiDiff = (regime.roi_percent - dca.roi_percent).toFixed(1);

  const secondaryMetrics = buildMockSecondaryMetrics(regime);

  // Extract reusable blocks to avoid duplication
  const configForm = (
    <div className="p-5 bg-gray-950 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-white">
        <Settings className="w-5 h-5 text-gray-400" />
        Configure
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-400">Days</label>
        <input
          type="number"
          value={config.days}
          onChange={e =>
            setConfig({ ...config, days: parseInt(e.target.value) || 0 })
          }
          className="bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:border-gray-500 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-400">Capital</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            $
          </span>
          <input
            type="number"
            value={config.capital}
            onChange={e =>
              setConfig({ ...config, capital: parseInt(e.target.value) || 0 })
            }
            className="bg-transparent border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-white w-full focus:border-gray-500 focus:outline-none"
          />
        </div>
      </div>
      <button className="flex items-center gap-2 w-full justify-center bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg px-4 py-2.5 hover:bg-blue-500/20 transition-colors">
        <Play className="w-4 h-4" />
        Run Backtest
      </button>
    </div>
  );

  const chartBlock = (
    <div className="bg-gray-950 p-0 min-h-[400px]">
      <BacktestChart
        chartData={MOCK_CHART_DATA}
        sortedStrategyIds={MOCK_SORTED_STRATEGY_IDS}
        yAxisDomain={MOCK_Y_AXIS_DOMAIN}
        actualDays={config.days}
        chartIdPrefix="bento"
      />
    </div>
  );

  const heroMetrics = (
    <>
      <div className="border-b lg:border-b border-gray-800 p-5 flex flex-col justify-center items-center">
        <div className="text-5xl font-bold tabular-nums text-emerald-400">
          +{regime.roi_percent.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-400 mt-1">ROI</div>
        <div className="text-xs text-emerald-400/60 mt-0.5">
          ▲ {roiDiff}% vs DCA
        </div>
      </div>
      <div className="border-b lg:border-b border-gray-800 p-5 flex flex-col justify-center items-center">
        <div className="text-4xl font-bold tabular-nums text-cyan-400">
          {regime.calmar_ratio?.toFixed(2) ?? "N/A"}
        </div>
        <div className="text-sm text-gray-400 mt-1">Calmar Ratio</div>
      </div>
      <div className="p-5 flex flex-col justify-center items-center">
        <div className="text-4xl font-bold tabular-nums text-rose-400">
          {regime.max_drawdown_percent?.toFixed(1) ?? "N/A"}%
        </div>
        <div className="text-sm text-gray-400 mt-1">Max Drawdown</div>
      </div>
    </>
  );

  const toggleRow = (
    <div className="border-t border-gray-800 p-4 flex items-center gap-3 col-span-full">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
          showDetails ? "bg-blue-500" : "bg-gray-700"
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            showDetails ? "translate-x-5" : ""
          }`}
        />
      </button>
      <span className="text-sm text-gray-400">Show Details</span>
    </div>
  );

  const detailsRow = (
    <AnimatePresence>
      {showDetails && (
        <motion.div
          {...COLLAPSE_ANIMATION}
          className="overflow-hidden border-t border-gray-800 col-span-full"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {secondaryMetrics.map((metric, idx) => (
              <div
                key={metric.label}
                className={`p-4 text-center ${
                  idx < secondaryMetrics.length - 1
                    ? "border-r border-gray-800"
                    : ""
                }`}
              >
                <div className="text-lg font-mono font-bold text-white">
                  {metric.value}
                </div>
                <div className="text-xs text-gray-500 mt-1">{metric.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-800 bg-gray-950">
      {/* Desktop Layout */}
      <div
        className="hidden lg:grid"
        style={{
          gridTemplateColumns: "280px 1fr 200px",
          gridTemplateRows: "1fr auto",
        }}
      >
        {/* Config cell */}
        <div className="border-r border-gray-800">{configForm}</div>

        {/* Chart cell */}
        <div className="border-r border-gray-800">{chartBlock}</div>

        {/* Metrics column (3 stacked) */}
        <div className="flex flex-col">{heroMetrics}</div>

        {/* Toggle row */}
        {toggleRow}

        {/* Details row */}
        {detailsRow}
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col">
        {/* Config bar */}
        <div className="border-b border-gray-800">{configForm}</div>

        {/* 3 metrics row */}
        <div className="grid grid-cols-3 border-b border-gray-800">
          {heroMetrics}
        </div>

        {/* Chart */}
        <div className="border-b border-gray-800">{chartBlock}</div>

        {/* Toggle */}
        {toggleRow}

        {/* Details */}
        {detailsRow}
      </div>
    </div>
  );
}

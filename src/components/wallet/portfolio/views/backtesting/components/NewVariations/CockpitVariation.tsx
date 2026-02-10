"use client";

import { AnimatePresence,motion } from "framer-motion";
import { ChevronDown, ChevronUp,Menu, Play, X } from "lucide-react";
import { useState } from "react";

import { BacktestChart } from "../BacktestChart";
import {
  buildMockSecondaryMetrics,
  MOCK_CHART_DATA,
  MOCK_CONFIG_DEFAULTS,
  MOCK_SORTED_STRATEGY_IDS,
  MOCK_STRATEGIES,
  MOCK_Y_AXIS_DOMAIN,
} from "./mockData";

// Cockpit: immersive full-bleed layout with floating metrics and config drawer
export function CockpitVariation(): React.ReactElement {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [config, setConfig] = useState({
    days: MOCK_CONFIG_DEFAULTS.days,
    capital: MOCK_CONFIG_DEFAULTS.capital,
  });

  // Derive hero metrics from regime strategy
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const regime = MOCK_STRATEGIES["simple_regime"]!;
  const roi = `+${regime.roi_percent.toFixed(1)}%`;
  const calmar = regime.calmar_ratio?.toFixed(2) ?? "N/A";
  const mdd = `${regime.max_drawdown_percent?.toFixed(1)}%`;

  const secondaryMetrics = buildMockSecondaryMetrics(regime);

  return (
    <div className="relative bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 min-h-[600px]">
      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center">
        {/* Config button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="backdrop-blur-xl bg-gray-900/60 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <Menu className="w-4 h-4" />
          <span className="text-sm font-medium">Config</span>
        </button>

        {/* Run button */}
        <button className="bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-blue-500/30 transition-colors">
          <Play className="w-4 h-4" />
          <span className="text-sm font-medium">Run</span>
        </button>
      </div>

      {/* Hero metrics */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex gap-4">
        {/* ROI */}
        <div className="backdrop-blur-xl bg-gray-900/60 border border-white/10 rounded-xl px-5 py-3">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            ROI
          </div>
          <div className="text-2xl font-bold tabular-nums text-emerald-400">
            {roi}
          </div>
        </div>

        {/* Calmar */}
        <div className="backdrop-blur-xl bg-gray-900/60 border border-white/10 rounded-xl px-5 py-3">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Calmar
          </div>
          <div className="text-2xl font-bold tabular-nums text-cyan-400">
            {calmar}
          </div>
        </div>

        {/* MDD */}
        <div className="backdrop-blur-xl bg-gray-900/60 border border-white/10 rounded-xl px-5 py-3">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            MDD
          </div>
          <div className="text-2xl font-bold tabular-nums text-rose-400">
            {mdd}
          </div>
        </div>
      </div>

      {/* Full-bleed chart */}
      <BacktestChart
        chartData={MOCK_CHART_DATA}
        sortedStrategyIds={MOCK_SORTED_STRATEGY_IDS}
        yAxisDomain={MOCK_Y_AXIS_DOMAIN}
        actualDays={config.days}
        chartIdPrefix="cockpit"
      />

      {/* Secondary metrics toggle */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
        <button
          onClick={() => setShowSecondary(!showSecondary)}
          className="text-gray-400 text-sm hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          {showSecondary ? (
            <>
              <ChevronDown className="w-4 h-4" />
              Hide Metrics
            </>
          ) : (
            <>
              <ChevronUp className="w-4 h-4" />
              More Metrics
            </>
          )}
        </button>

        <AnimatePresence>
          {showSecondary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="backdrop-blur-xl bg-gray-900/80 border border-white/10 rounded-xl px-6 py-3 flex items-center gap-6"
            >
              {secondaryMetrics.map((metric, index) => (
                <div key={metric.label} className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">
                      {metric.label}
                    </span>
                    <span className="text-lg font-bold tabular-nums text-white">
                      {metric.value}
                    </span>
                  </div>
                  {index < secondaryMetrics.length - 1 && (
                    <div className="w-px h-8 bg-white/10" />
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Config drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 z-50 backdrop-blur-xl bg-gray-950/95 border-r border-gray-800 p-6 flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white">Configure</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form fields */}
              <div className="space-y-6 flex-1">
                {/* Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Backtest Period (days)
                  </label>
                  <input
                    type="number"
                    value={config.days}
                    onChange={e =>
                      setConfig({ ...config, days: parseInt(e.target.value) })
                    }
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Starting Capital */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Starting Capital
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      value={config.capital}
                      onChange={e =>
                        setConfig({
                          ...config,
                          capital: parseInt(e.target.value),
                        })
                      }
                      className="bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Run button */}
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors mt-6">
                <Play className="w-4 h-4" />
                <span className="font-medium">Run Backtest</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

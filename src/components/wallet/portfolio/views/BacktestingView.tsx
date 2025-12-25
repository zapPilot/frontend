"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Play,
  RefreshCw,
  RotateCcw,
  Settings,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { BaseCard } from "@/components/ui/BaseCard";

// Helper function to calculate chart bar heights (reduces cognitive complexity)
const calculateBarHeight = (
  index: number,
  strategyType: "conservative" | "aggressive",
  useLeverage: boolean
): number => {
  const baseTrend = index * 2;
  const volatility = Math.sin(index * 0.5) * 15;
  const strategyMultiplier = strategyType === "aggressive" ? 1.5 : 0.8;
  const leverageMultiplier = useLeverage ? 1.2 : 1;

  return Math.min(
    90,
    Math.max(
      10,
      20 +
        baseTrend * 0.5 +
        volatility * strategyMultiplier * leverageMultiplier +
        Math.random() * 10
    )
  );
};

// Extract summary cards to reduce complexity
const SimulationSummary = ({
  strategyType,
  useLeverage,
  dcaFrequency,
}: {
  strategyType: "conservative" | "aggressive";
  useLeverage: boolean;
  dcaFrequency: string;
}) => (
  <div className="grid grid-cols-3 gap-4">
    <BaseCard
      variant="glass"
      className="p-5 bg-green-500/5 border-green-500/20"
    >
      <div className="text-xs text-green-400 font-medium mb-1.5 flex items-center gap-1">
        Total Return
        {useLeverage && (
          <span className="text-[9px] bg-green-500/20 px-1 rounded">LEV</span>
        )}
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">
        {strategyType === "aggressive"
          ? useLeverage
            ? "+412.5%"
            : "+342.5%"
          : "+125.4%"}
      </div>
      <div className="text-[11px] text-gray-400 mt-1">vs +180% Buy & Hold</div>
    </BaseCard>
    <BaseCard variant="glass" className="p-5">
      <div className="text-xs text-gray-400 font-medium mb-1.5">
        Max Drawdown
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">
        {strategyType === "aggressive"
          ? useLeverage
            ? "-22.4%"
            : "-18.2%"
          : "-8.5%"}
      </div>
      <div className="text-[11px] text-gray-400 mt-1">vs -75% Buy & Hold</div>
    </BaseCard>
    <BaseCard variant="glass" className="p-5">
      <div className="text-xs text-gray-400 font-medium mb-1.5">
        Trades Executed
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">
        {dcaFrequency === "Daily"
          ? "1,420"
          : dcaFrequency === "Weekly"
            ? "208"
            : "48"}
      </div>
      <div className="text-[11px] text-gray-400 mt-1">
        Avg{" "}
        {dcaFrequency === "Daily"
          ? "30"
          : dcaFrequency === "Weekly"
            ? "4"
            : "1"}{" "}
        per month
      </div>
    </BaseCard>
  </div>
);

export const BacktestingView = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Configuration State
  const [strategyType, setStrategyType] = useState<
    "conservative" | "aggressive"
  >("aggressive");
  const [useLeverage, setUseLeverage] = useState(false);
  const [timeframe, setTimeframe] = useState("Last Cycle (2020-2024)");
  const [dcaFrequency, setDcaFrequency] = useState("Weekly");
  const [initialCapital, setInitialCapital] = useState("10,000");

  const handleSimulate = () => {
    setIsSimulating(true);
    // Simulate processing time
    setTimeout(() => {
      setIsSimulating(false);
      setShowResults(true);
    }, 1500);
  };

  const handleResetDefaults = () => {
    setStrategyType("aggressive");
    setUseLeverage(false);
    setTimeframe("Last Cycle (2020-2024)");
    setDcaFrequency("Weekly");
    setInitialCapital("10,000");
    setShowResults(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Strategy Simulator
        </h2>
        <p className="text-sm text-gray-400">
          Test Zap Pilot strategy against historical market scenarios with
          custom parameters
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <BaseCard variant="glass" className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuration
              </h3>
              <button
                onClick={handleResetDefaults}
                className="text-[10px] text-gray-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Strategy Select */}
            <div className="space-y-3">
              <label className="text-xs text-gray-400 font-medium ml-1">
                Strategy Profile
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900/40 rounded-xl border border-gray-800">
                <button
                  onClick={() => setStrategyType("conservative")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-all ${
                    strategyType === "conservative"
                      ? "bg-gray-800 border border-gray-700 text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-800/50 hover:text-gray-300"
                  }`}
                >
                  <Shield
                    className={`w-4 h-4 ${strategyType === "conservative" ? "text-emerald-400" : ""}`}
                  />
                  Conservative
                </button>
                <button
                  onClick={() => setStrategyType("aggressive")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-all ${
                    strategyType === "aggressive"
                      ? "bg-gray-800 border border-gray-700 text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-800/50 hover:text-gray-300"
                  }`}
                >
                  <TrendingUp
                    className={`w-4 h-4 ${strategyType === "aggressive" ? "text-blue-400" : ""}`}
                  />
                  Aggressive
                </button>
              </div>
            </div>

            {/* Leverage Toggle (Conditional) */}
            <AnimatePresence>
              {strategyType === "aggressive" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-blue-200">
                        Enable Smart Leverage
                      </div>
                      <div className="text-[10px] text-blue-300/60">
                        Boosts exposure during strong trends
                      </div>
                    </div>
                    <button
                      onClick={() => setUseLeverage(!useLeverage)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${useLeverage ? "bg-blue-500" : "bg-gray-700"}`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${useLeverage ? "translate-x-5" : ""}`}
                      />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timeframe Select */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium ml-1">
                Time Period
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Last Cycle (2020-2024)",
                  "Bear Market 2022",
                  "Bull Run 2021",
                  "YTD 2024",
                ].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setTimeframe(opt)}
                    className={`text-xs p-2.5 rounded-lg border text-left transition-all ${
                      timeframe === opt
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-200 font-medium"
                        : "bg-gray-900/30 border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings: DCA & Capital */}
            <div className="pt-2 border-t border-gray-800 space-y-4">
              {/* DCA Frequency */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-medium ml-1">
                  DCA Frequency
                </label>
                <div className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-800">
                  {["Daily", "Weekly", "Monthly"].map(freq => (
                    <button
                      key={freq}
                      onClick={() => setDcaFrequency(freq)}
                      className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                        dcaFrequency === freq
                          ? "bg-gray-700 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Capital */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-medium ml-1">
                  Initial Capital
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm group-focus-within:text-blue-400 transition-colors">
                    $
                  </span>
                  <input
                    type="text"
                    value={initialCapital}
                    onChange={e => setInitialCapital(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 text-sm text-white rounded-lg pl-6 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                  Run Backtest
                </>
              )}
            </button>
          </BaseCard>

          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 flex gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-yellow-600/60 shrink-0" />
            <p className="text-xs text-yellow-200/40 leading-relaxed">
              Past performance is not indicative of future results. Simulation
              assumes perfect execution and zero slippage.
            </p>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2">
          {!showResults ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl p-8 text-center text-gray-500">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <Zap className="relative w-16 h-16 text-gray-700 mb-6" />
              </div>
              <h3 className="text-xl font-medium text-gray-200 mb-2">
                Ready to Simulate
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Configure your strategy parameters on the left and start the
                backtest to see how{" "}
                {strategyType === "aggressive"
                  ? "Zap Pilot Aggressive"
                  : "Zap Pilot Conservative"}{" "}
                would have performed.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              {/* Summary Cards */}
              <SimulationSummary
                strategyType={strategyType}
                useLeverage={useLeverage}
                dcaFrequency={dcaFrequency}
              />

              {/* Chart Placeholder */}
              <BaseCard
                variant="glass"
                className="p-1 h-[360px] relative overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-gray-800/50 bg-gray-900/30 flex justify-between items-center">
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    Portfolio Value Growth
                    <span className="text-xs font-normal text-gray-500">
                      ({timeframe})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Strategy
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                      BTC Hold
                    </div>
                  </div>
                </div>

                <div className="flex-1 relative w-full pt-8 px-4 pb-0 flex items-end justify-between gap-1 overflow-visible">
                  {/* Fake Area Chart Construction */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,360 L0,200 Q150,100 300,150 T600,50 L900,100 L900,360 Z"
                      fill="url(#gradient)"
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity="0.5"
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Fake Bars for Visual Texture */}
                  {[...Array(40)].map((_, i) => {
                    const height = calculateBarHeight(
                      i,
                      strategyType,
                      useLeverage
                    );

                    return (
                      <motion.div
                        key={i}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: `${height}%`, opacity: 1 }}
                        transition={{ delay: i * 0.02, duration: 0.5 }}
                        className={`flex-1 rounded-t-sm transition-all duration-500 ${
                          i % 5 === 0
                            ? "bg-blue-500/60"
                            : "bg-blue-500/20 hover:bg-blue-400/40"
                        }`}
                      />
                    );
                  })}
                </div>
              </BaseCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

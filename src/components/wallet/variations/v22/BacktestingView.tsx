"use client";

import {
  Activity,
  AlertTriangle,
  Play,
  RefreshCw,
  Settings,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { BaseCard } from "@/components/ui/BaseCard";

export const BacktestingView = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setShowResults(true);
    }, 2000); // 2-second fake loading
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
          Test Zap Pilot strategy against historical market scenarios
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <BaseCard variant="glass" className="p-5 space-y-5">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </h3>

            {/* Strategy Select */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium ml-1">
                Strategy Profile
              </label>
              <select className="w-full bg-gray-900/50 border border-gray-700 text-sm text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none">
                <option>Active Zap Pilot (Default)</option>
                <option>Conservative (Stable Heavy)</option>
                <option>Aggressive (Leveraged)</option>
              </select>
            </div>

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
                ].map((opt, i) => (
                  <button
                    key={i}
                    className={`text-xs p-2 rounded-lg border text-left ${i === 0 ? "bg-blue-500/20 border-blue-500/40 text-blue-200" : "bg-gray-800/30 border-gray-700 text-gray-400 hover:bg-gray-800"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Initial Capital */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium ml-1">
                Initial Capital
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">
                  $
                </span>
                <input
                  type="text"
                  defaultValue="10,000"
                  className="w-full bg-gray-900/50 border border-gray-700 text-sm text-white rounded-lg pl-6 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run Backtest
                </>
              )}
            </button>
          </BaseCard>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
            <p className="text-xs text-yellow-200/80 leading-relaxed">
              Past performance is not indicative of future results. Simulation
              assumes perfect execution and zero slippage.
            </p>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2">
          {!showResults ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl p-8 text-center text-gray-500">
              <Zap className="w-12 h-12 text-gray-700 mb-4" />
              <h3 className="text-lg font-medium text-gray-300">
                Ready to Simulate
              </h3>
              <p className="text-sm max-w-sm mx-auto mt-2">
                Configure your parameters on the left and hit &ldquo;Run
                Backtest&rdquo; to generate a detailed performance report.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <BaseCard
                  variant="glass"
                  className="p-4 bg-green-500/5 border-green-500/20"
                >
                  <div className="text-xs text-green-400 font-medium mb-1">
                    Total Return
                  </div>
                  <div className="text-2xl font-bold text-white">+342.5%</div>
                  <div className="text-[10px] text-gray-400">
                    vs +180% Buy & Hold
                  </div>
                </BaseCard>
                <BaseCard variant="glass" className="p-4">
                  <div className="text-xs text-gray-400 font-medium mb-1">
                    Max Drawdown
                  </div>
                  <div className="text-2xl font-bold text-white">-18.2%</div>
                  <div className="text-[10px] text-gray-400">
                    vs -75% Buy & Hold
                  </div>
                </BaseCard>
                <BaseCard variant="glass" className="p-4">
                  <div className="text-xs text-gray-400 font-medium mb-1">
                    Trades Executed
                  </div>
                  <div className="text-2xl font-bold text-white">42</div>
                  <div className="text-[10px] text-gray-400">
                    Avg 1.2 per month
                  </div>
                </BaseCard>
              </div>

              {/* Chart Placeholder */}
              <BaseCard
                variant="glass"
                className="p-1 h-[320px] relative overflow-hidden"
              >
                <div className="absolute inset-x-0 bottom-0 top-10 flex items-end px-4 pb-4 gap-1">
                  {/* Fake Bar Chart */}
                  {[...Array(30)].map((_, i) => {
                    const height = 20 + Math.random() * 60;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-blue-500/30 hover:bg-blue-500/50 transition-colors rounded-t-sm"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
                <div className="p-4 border-b border-gray-800/50 bg-gray-900/30 text-sm font-medium text-white">
                  Portfolio Value Growth
                </div>
              </BaseCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

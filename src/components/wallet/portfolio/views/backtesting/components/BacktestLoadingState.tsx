"use client";

import { RefreshCw } from "lucide-react";

export function BacktestLoadingState() {
  return (
    <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl p-8 text-center text-gray-500 animate-pulse">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
        <RefreshCw className="relative w-16 h-16 text-blue-500 animate-spin" />
      </div>
      <h3 className="text-xl font-medium text-gray-200 mb-2">
        Running Backtest Simulation
      </h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        Processing historical market data and calculating strategy returns...
      </p>
    </div>
  );
}

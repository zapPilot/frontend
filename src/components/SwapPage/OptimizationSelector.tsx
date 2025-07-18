"use client";

import { ArrowRightLeft, Coins } from "lucide-react";
import { OptimizationOptions } from "./OptimizeTab";

interface OptimizationSelectorProps {
  options: OptimizationOptions;
  onChange: (options: OptimizationOptions) => void;
  mockData: {
    dustValue: number;
    dustTokenCount: number;
    rebalanceActions: number;
    chainCount: number;
  };
}

export function OptimizationSelector({
  options,
  onChange,
  mockData,
}: OptimizationSelectorProps) {
  const handleToggle = (
    type: keyof Pick<OptimizationOptions, "convertDust" | "rebalancePortfolio">
  ) => {
    onChange({
      ...options,
      [type]: !options[type],
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-white">Choose Optimizations</h4>

      <div className="space-y-3">
        {/* Dust Conversion Option */}
        <label
          className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
            options.convertDust
              ? "bg-blue-500/20 border border-blue-500/50"
              : "bg-gray-900/30 border border-gray-700 hover:bg-gray-900/50"
          }`}
          onClick={() => handleToggle("convertDust")}
        >
          <input
            type="checkbox"
            checked={options.convertDust}
            onChange={() => handleToggle("convertDust")}
            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-2"
          />

          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-blue-500" />
            </div>

            <div className="flex-1">
              <div className="font-medium text-white">Convert Dust to ETH</div>
              <div className="text-sm text-gray-400">
                Convert {mockData.dustTokenCount} small token balances worth $
                {mockData.dustValue}
              </div>
              <div className="text-xs text-blue-400 mt-1">
                Estimated savings: ~$2.50 in gas fees
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-blue-500">
                ${mockData.dustValue}
              </div>
              <div className="text-xs text-gray-400">
                {mockData.dustTokenCount} tokens
              </div>
            </div>
          </div>
        </label>

        {/* Portfolio Rebalance Option */}
        <label
          className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
            options.rebalancePortfolio
              ? "bg-purple-500/20 border border-purple-500/50"
              : "bg-gray-900/30 border border-gray-700 hover:bg-gray-900/50"
          }`}
          onClick={() => handleToggle("rebalancePortfolio")}
        >
          <input
            type="checkbox"
            checked={options.rebalancePortfolio}
            onChange={() => handleToggle("rebalancePortfolio")}
            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-2"
          />

          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-purple-500" />
            </div>

            <div className="flex-1">
              <div className="font-medium text-white">Rebalance Portfolio</div>
              <div className="text-sm text-gray-400">
                Optimize allocation across {mockData.chainCount} chains with{" "}
                {mockData.rebalanceActions} actions
              </div>
              <div className="text-xs text-purple-400 mt-1">
                Estimated improvement: +2.3% APR efficiency
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-purple-500">
                {mockData.rebalanceActions}
              </div>
              <div className="text-xs text-gray-400">actions</div>
            </div>
          </div>
        </label>
      </div>

      {/* Summary */}
      {(options.convertDust || options.rebalancePortfolio) && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30">
          <div className="text-sm text-gray-300">
            <span className="font-medium">Selected optimizations:</span>{" "}
            {options.convertDust && options.rebalancePortfolio
              ? "Dust conversion + Portfolio rebalancing"
              : options.convertDust
                ? "Dust conversion only"
                : "Portfolio rebalancing only"}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Estimated completion time:{" "}
            {options.convertDust && options.rebalancePortfolio ? "3-5" : "2-3"}{" "}
            minutes
          </div>
        </div>
      )}
    </div>
  );
}

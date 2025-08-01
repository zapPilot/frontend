"use client";

import { ChevronDown, Settings } from "lucide-react";
import { useState } from "react";
import { useSlippage, type SlippagePreset } from "../PortfolioAllocation/hooks";

interface SlippageSelectorProps {
  slippage: number;
  onChange: (slippage: number) => void;
  className?: string;
}

const SLIPPAGE_OPTIONS: SlippagePreset[] = [
  {
    value: 1,
    label: "1% (Low)",
    description: "May fail during high volatility",
  },
  {
    value: 5,
    label: "5% (Standard)",
    description: "Recommended for most transactions",
    isDefault: true,
  },
  {
    value: 10,
    label: "10% (Medium)",
    description: "Better success rate",
  },
  {
    value: 20,
    label: "20% (High)",
    description: "High tolerance for volatility",
  },
  {
    value: 30,
    label: "30% (Maximum)",
    description: "Maximum protection against MEV",
  },
];

export function SlippageSelector({
  slippage,
  onChange,
  className = "",
}: SlippageSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const slippageHook = useSlippage(onChange, {
    initialValue: slippage,
    presets: SLIPPAGE_OPTIONS,
    highSlippageThreshold: 20,
    veryHighSlippageThreshold: 30,
    allowCustomInput: true,
  });

  return (
    <div className={`space-y-3 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 hover:bg-gray-900/70 transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          <Settings className="w-4 h-4 text-gray-400" />
          <div className="text-left">
            <div className="text-sm font-medium text-white">
              Slippage Tolerance
            </div>
            <div className="text-xs text-gray-400">
              Current:{" "}
              <span
                className={slippageHook.getSlippageColor(slippageHook.value)}
              >
                {slippageHook.value}% (
                {slippageHook.getSlippageDescription(slippageHook.value)})
              </span>
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-700 space-y-3">
          <div className="text-sm font-medium text-white mb-3">
            Select Slippage Tolerance
          </div>

          <div className="space-y-2">
            {slippageHook.presets.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  slippageHook.handlePresetClick(option.value);
                  setIsExpanded(false);
                }}
                className={`w-full p-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                  slippageHook.value === option.value
                    ? "bg-purple-500/20 border border-purple-500/50"
                    : "bg-gray-800/50 border border-gray-600 hover:bg-gray-800/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className={`font-medium ${slippageHook.value === option.value ? "text-purple-300" : "text-white"}`}
                    >
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {option.description}
                    </div>
                  </div>

                  {slippageHook.value === option.value && (
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Custom slippage input */}
          <div className="pt-3 border-t border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Custom Slippage</div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={slippageHook.customValue || slippageHook.value}
                onChange={e => {
                  const value = e.target.value;
                  slippageHook.setCustomValue(value);
                  const numValue =
                    slippageHook.validateAndParseCustomValue(value);
                  if (numValue !== null) {
                    slippageHook.setValue(numValue);
                  }
                }}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter custom %"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Range: 0.1% - 50%</div>
          </div>

          {/* Warning for high slippage */}
          {slippageHook.warning.type !== "none" && (
            <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-black text-xs font-bold">!</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-amber-400">
                    {slippageHook.warning.title}
                  </div>
                  <div className="text-xs text-amber-300 mt-1">
                    {slippageHook.warning.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Information footer */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
            Slippage tolerance affects the minimum amount you will receive.
            Higher values increase success rate but may result in worse prices.
          </div>
        </div>
      )}
    </div>
  );
}

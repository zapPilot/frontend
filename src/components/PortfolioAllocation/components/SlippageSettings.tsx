"use client";

import { motion } from "framer-motion";
import { Settings, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { SlippagePreset } from "../types";

interface SlippageSettingsProps {
  value: number; // Current slippage tolerance (percentage)
  onChange: (value: number) => void;
  className?: string;
}

const SLIPPAGE_PRESETS: SlippagePreset[] = [
  { label: "0.1%", value: 0.1 },
  { label: "0.5%", value: 0.5, isDefault: true },
  { label: "1%", value: 1.0 },
  { label: "3%", value: 3.0 },
];

export const SlippageSettings: React.FC<SlippageSettingsProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const isCustomValue = !SLIPPAGE_PRESETS.some(
    preset => preset.value === value
  );
  const isHighSlippage = value > 5;
  const isVeryHighSlippage = value > 10;

  const handlePresetClick = (presetValue: number) => {
    onChange(presetValue);
    setCustomValue("");
  };

  const handleCustomSubmit = () => {
    const numValue = parseFloat(customValue);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      onChange(numValue);
    }
  };

  const handleCustomKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCustomSubmit();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Slippage Display Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
          isHighSlippage
            ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
            : isVeryHighSlippage
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : "border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-800"
        }`}
        data-testid="slippage-button"
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">
          {value.toFixed(value < 1 ? 1 : 0)}%
        </span>
        {isHighSlippage && <AlertTriangle className="w-4 h-4" />}
      </button>

      {/* Expanded Settings Panel */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute top-full left-0 mt-2 p-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-xl z-50 min-w-[280px]"
          data-testid="slippage-panel"
        >
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h4 className="text-sm font-medium text-white mb-1">
                Slippage Tolerance
              </h4>
              <p className="text-xs text-gray-400">
                Maximum price movement you&apos;re willing to accept
              </p>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {SLIPPAGE_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    value === preset.value
                      ? "bg-purple-500 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                  data-testid={`slippage-preset-${preset.value}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Custom (%)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  onKeyPress={handleCustomKeyPress}
                  placeholder={isCustomValue ? value.toString() : "1.0"}
                  min="0"
                  max="50"
                  step="0.1"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  data-testid="slippage-custom-input"
                />
                <button
                  onClick={handleCustomSubmit}
                  className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                  data-testid="slippage-custom-submit"
                >
                  Set
                </button>
              </div>
            </div>

            {/* Warning Messages */}
            {isHighSlippage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-3 rounded-lg border ${
                  isVeryHighSlippage
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-yellow-500/30 bg-yellow-500/10"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      isVeryHighSlippage ? "text-red-400" : "text-yellow-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isVeryHighSlippage ? "text-red-400" : "text-yellow-400"
                    }`}
                  >
                    {isVeryHighSlippage
                      ? "Very High Slippage"
                      : "High Slippage"}
                  </span>
                </div>
                <p
                  className={`text-xs mt-1 ${
                    isVeryHighSlippage ? "text-red-300" : "text-yellow-300"
                  }`}
                >
                  {isVeryHighSlippage
                    ? "Your transaction may be frontrun or result in significant losses"
                    : "You may receive less than expected due to price movement"}
                </p>
              </motion.div>
            )}

            {/* Current Selection Display */}
            <div className="pt-2 border-t border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Current tolerance:</span>
                <span className="text-white font-medium">
                  {value.toFixed(value < 1 ? 1 : 0)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Backdrop to close panel */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

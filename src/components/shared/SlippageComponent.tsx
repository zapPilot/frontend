"use client";

import { motion } from "framer-motion";
import { Settings, AlertTriangle, ChevronDown } from "lucide-react";
import { useSlippage, type SlippagePreset } from "../PortfolioAllocation/hooks";
import { useDropdown } from "@/hooks/useDropdown";

interface SlippageComponentProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  variant?: "compact" | "expanded";
  context?: "portfolio" | "swap";
  /**
   * Controls dropdown positioning relative to the button
   * - 'left': Align dropdown's left edge with button's left edge
   * - 'right': Align dropdown's right edge with button's right edge
   * - 'center': Center dropdown relative to button
   * - 'left-center': Optimal for right-positioned buttons - expands towards left-center
   * - 'auto': Smart responsive positioning (default)
   */
  dropdownPosition?: "left" | "right" | "center" | "left-center" | "auto";
}

const CONTEXT_CONFIGS = {
  portfolio: {
    presets: [
      { label: "0.1%", value: 0.1 },
      { label: "0.5%", value: 0.5, isDefault: true },
      { label: "1%", value: 1.0 },
      { label: "3%", value: 3.0 },
    ] as SlippagePreset[],
    thresholds: { high: 5, veryHigh: 10 },
  },
  swap: {
    presets: [
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
      { value: 10, label: "10% (Medium)", description: "Better success rate" },
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
    ] as SlippagePreset[],
    thresholds: { high: 20, veryHigh: 30 },
  },
};

export const SlippageComponent: React.FC<SlippageComponentProps> = ({
  value,
  onChange,
  className = "",
  variant = "compact",
  context = "portfolio",
  dropdownPosition = "auto",
}) => {
  const dropdown = useDropdown(false);
  const config = CONTEXT_CONFIGS[context];

  const slippage = useSlippage(onChange, {
    initialValue: value,
    presets: config.presets,
    highSlippageThreshold: config.thresholds.high,
    veryHighSlippageThreshold: config.thresholds.veryHigh,
    allowCustomInput: true,
  });

  // Smart dropdown positioning logic
  const getDropdownClasses = () => {
    const baseClasses =
      "absolute top-full mt-2 p-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-xl z-50";

    switch (dropdownPosition) {
      case "left":
        // Align dropdown's left edge with button's left edge
        return `${baseClasses} left-0 w-full max-w-xs sm:max-w-sm`;
      case "right":
        // Align dropdown's right edge with button's right edge (optimal for right-side buttons)
        return `${baseClasses} right-0 w-full max-w-xs sm:w-80`;
      case "center":
        // Center the dropdown relative to the button
        return `${baseClasses} left-1/2 transform -translate-x-1/2 w-full max-w-xs sm:max-w-sm`;
      case "left-center":
        // Optimal for right-positioned buttons: dropdown expands towards left-center
        // Mobile: full width, Desktop: positioned to expand left-center from right-aligned button
        return `${baseClasses} left-0 right-0 sm:right-0 sm:left-auto sm:w-80 sm:max-w-none`;
      case "auto":
      default:
        // Smart auto positioning: responsive behavior for common use cases
        // Mobile: full width, Desktop: right-aligned for better UX when button is on right side
        return `${baseClasses} left-0 right-0 sm:right-0 sm:left-auto sm:w-80`;
    }
  };

  // Compact variant (used in portfolio context)
  if (variant === "compact") {
    return (
      <div className={`relative ${className}`}>
        {/* Slippage Display Button */}
        <button
          onClick={dropdown.toggle}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
            slippage.isVeryHighSlippage
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : slippage.isHighSlippage
                ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                : "border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-800"
          }`}
          data-testid="slippage-button"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">
            {slippage.formatValue(slippage.value)}%
          </span>
          {slippage.isHighSlippage && <AlertTriangle className="w-4 h-4" />}
        </button>

        {/* Expanded Settings Panel */}
        {dropdown.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={getDropdownClasses()}
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {slippage.presets.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => slippage.handlePresetClick(preset.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      slippage.value === preset.value
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
                    value={slippage.customValue}
                    onChange={e => slippage.setCustomValue(e.target.value)}
                    onKeyPress={slippage.handleCustomKeyPress}
                    placeholder={
                      slippage.isCustomValue ? slippage.value.toString() : "1.0"
                    }
                    min="0"
                    max="50"
                    step="0.1"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    data-testid="slippage-custom-input"
                  />
                  <button
                    onClick={slippage.handleCustomSubmit}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                    data-testid="slippage-custom-submit"
                  >
                    Set
                  </button>
                </div>
              </div>

              {/* Warning Messages */}
              {slippage.warning.type !== "none" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-3 rounded-lg border ${
                    slippage.warning.color === "red"
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-yellow-500/30 bg-yellow-500/10"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        slippage.warning.color === "red"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        slippage.warning.color === "red"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {slippage.warning.title}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      slippage.warning.color === "red"
                        ? "text-red-300"
                        : "text-yellow-300"
                    }`}
                  >
                    {slippage.warning.message}
                  </p>
                </motion.div>
              )}

              {/* Current Selection Display */}
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Current tolerance:</span>
                  <span className="text-white font-medium">
                    {slippage.formatValue(slippage.value)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Backdrop to close panel */}
        {dropdown.isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => dropdown.close()}
          />
        )}
      </div>
    );
  }

  // Expanded variant (used in swap context)
  return (
    <div className={`space-y-3 ${className}`}>
      <button
        onClick={dropdown.toggle}
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
              <span className={slippage.getSlippageColor(slippage.value)}>
                {slippage.value}% (
                {slippage.getSlippageDescription(slippage.value)})
              </span>
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            dropdown.isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {dropdown.isOpen && (
        <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-700 space-y-3">
          <div className="text-sm font-medium text-white mb-3">
            Select Slippage Tolerance
          </div>

          <div className="space-y-2">
            {slippage.presets.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  slippage.handlePresetClick(option.value);
                  dropdown.close();
                }}
                className={`w-full p-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                  slippage.value === option.value
                    ? "bg-purple-500/20 border border-purple-500/50"
                    : "bg-gray-800/50 border border-gray-600 hover:bg-gray-800/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className={`font-medium ${slippage.value === option.value ? "text-purple-300" : "text-white"}`}
                    >
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-gray-400 mt-1">
                        {option.description}
                      </div>
                    )}
                  </div>

                  {slippage.value === option.value && (
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
                value={slippage.customValue || slippage.value}
                onChange={e => {
                  const value = e.target.value;
                  slippage.setCustomValue(value);
                  const numValue = slippage.validateAndParseCustomValue(value);
                  if (numValue !== null) {
                    slippage.setValue(numValue);
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
          {slippage.warning.type !== "none" && (
            <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-black text-xs font-bold">!</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-amber-400">
                    {slippage.warning.title}
                  </div>
                  <div className="text-xs text-amber-300 mt-1">
                    {slippage.warning.message}
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
};

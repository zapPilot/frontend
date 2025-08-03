"use client";

import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Coins,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { formatSmallCurrency } from "../../../utils/formatters";
import {
  calculateTotalTokenValue,
  getTokenSymbol,
} from "../../../utils/tokenUtils";
import { SlippageComponent } from "../../shared/SlippageComponent";
import { TokenImage } from "../../shared/TokenImage";
import type { OperationMode, ProcessedAssetCategory } from "../types";

// Optimization interfaces (from ActionCenter)
export interface OptimizationOptions {
  convertDust: boolean;
  rebalancePortfolio: boolean;
  slippage: number;
}

export interface DustToken {
  id: string;
  symbol: string;
  optimized_symbol?: string;
  amount: number;
  price: number;
  logo_url?: string;
}

interface PortfolioOperationSummaryProps {
  operationMode: OperationMode;
  includedCategories: ProcessedAssetCategory[];
  enableOptimization?: boolean;
  optimizationOptions?: OptimizationOptions | undefined;
  onOptimizationChange?: ((options: OptimizationOptions) => void) | undefined;
  dustTokens?: DustToken[] | undefined;
  loadingDustTokens?: boolean | undefined;
  onOptimizeAction?: (() => void) | undefined;
  className?: string;
}

export const PortfolioOperationSummary: React.FC<
  PortfolioOperationSummaryProps
> = ({
  operationMode,
  includedCategories,
  enableOptimization = false,
  optimizationOptions,
  onOptimizationChange,
  dustTokens = [],
  loadingDustTokens = false,
  onOptimizeAction,
  className = "",
}) => {
  const [showOptimization, setShowOptimization] = useState(false);

  // Determine mode-specific configuration
  const modeConfig = useMemo(() => {
    switch (operationMode) {
      case "zapOut":
        return {
          title: "Converting From Portfolio",
          description: "Portfolio breakdown for conversion",
          showOptimization: false,
        };
      case "rebalance":
        return {
          title: "Rebalancing Portfolio",
          description: "Portfolio optimization and rebalancing",
          showOptimization: enableOptimization,
        };
      default:
        return {
          title: "Portfolio Summary",
          description: "",
          showOptimization: false,
        };
    }
  }, [operationMode, enableOptimization]);

  // Dust token calculations
  const dustTokenData = useMemo(() => {
    const dustValue = calculateTotalTokenValue(dustTokens);
    const dustTokenCount = dustTokens.length;
    const displayTokens = dustTokens
      .slice()
      .sort((a, b) => b.price * b.amount - a.price * a.amount)
      .slice(0, 3);

    return {
      dustValue,
      dustTokenCount,
      displayTokens,
    };
  }, [dustTokens]);

  // Handle optimization option changes
  const handleOptimizationToggle = useCallback(
    (field: keyof OptimizationOptions, value: boolean | number) => {
      if (!onOptimizationChange || !optimizationOptions) return;

      onOptimizationChange({
        ...optimizationOptions,
        [field]: value,
      });
    },
    [optimizationOptions, onOptimizationChange]
  );

  // Only render for specific operation modes (after all hooks)
  if (!["zapOut", "rebalance"].includes(operationMode)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800/50 rounded-lg p-4 space-y-4 ${className}`}
      data-testid="portfolio-operation-summary"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-white">{modeConfig.title}</h4>
          {modeConfig.description && (
            <p className="text-xs text-gray-400 mt-1">
              {modeConfig.description}
            </p>
          )}
        </div>

        {/* Optimization Toggle */}
        {modeConfig.showOptimization && (
          <button
            onClick={() => setShowOptimization(!showOptimization)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-all duration-200"
          >
            <Settings2 className="w-4 h-4" />
            <span className="text-sm">Optimize</span>
            {showOptimization ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Portfolio Breakdown */}
      <div className="space-y-2">
        {includedCategories.map(category => (
          <div
            key={category.id}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-gray-300">{category.name}</span>
            </div>
            <div className="text-right">
              <div className="text-white">
                ${category.totalValue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">
                {category.activeAllocationPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Optimization Panel */}
      {modeConfig.showOptimization && showOptimization && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 pt-4 border-t border-gray-700"
        >
          {/* Optimization Options */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-white">
              Optimization Options
            </h5>

            {/* Convert Dust Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Coins className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-sm text-white">Convert Dust Tokens</div>
                  <div className="text-xs text-gray-400">
                    {loadingDustTokens
                      ? "Loading..."
                      : dustTokenData.dustTokenCount > 0
                        ? `${dustTokenData.dustTokenCount} tokens worth ${formatSmallCurrency(dustTokenData.dustValue)}`
                        : "No dust tokens found"}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={optimizationOptions?.convertDust || false}
                  onChange={e =>
                    handleOptimizationToggle("convertDust", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Dust Token Preview */}
            {dustTokenData.dustTokenCount > 0 &&
              optimizationOptions?.convertDust && (
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-400">Preview:</div>
                      <div className="flex items-center gap-1">
                        {dustTokenData.displayTokens.map(token => (
                          <div
                            key={token.id}
                            className="flex items-center gap-1"
                          >
                            <TokenImage token={token} size={16} />
                            <span className="text-xs text-gray-400">
                              {getTokenSymbol(token)}
                            </span>
                          </div>
                        ))}
                        {dustTokenData.dustTokenCount > 3 && (
                          <span className="text-xs text-gray-400">
                            +{dustTokenData.dustTokenCount - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-blue-400">
                      {formatSmallCurrency(dustTokenData.dustValue)}
                    </div>
                  </div>
                </div>
              )}

            {/* Rebalance Portfolio Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <RotateCcw className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-sm text-white">Rebalance Portfolio</div>
                  <div className="text-xs text-gray-400">
                    Optimize allocation across chains
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={optimizationOptions?.rebalancePortfolio || false}
                  onChange={e =>
                    handleOptimizationToggle(
                      "rebalancePortfolio",
                      e.target.checked
                    )
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Rebalance Preview */}
            {optimizationOptions?.rebalancePortfolio && (
              <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-purple-400">
                    Estimated improvement: +2.3% APR efficiency
                  </div>
                  <div className="text-sm font-medium text-purple-400">
                    3 actions
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Slippage Settings */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-white">Slippage Tolerance</div>
            <SlippageComponent
              value={optimizationOptions?.slippage || 30}
              onChange={slippage =>
                handleOptimizationToggle("slippage", slippage)
              }
              context="swap"
              variant="compact"
              dropdownPosition="left-center"
            />
          </div>

          {/* Optimize Action Button */}
          {onOptimizeAction &&
            (optimizationOptions?.convertDust ||
              optimizationOptions?.rebalancePortfolio) && (
              <button
                onClick={onOptimizeAction}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
              >
                {optimizationOptions?.convertDust &&
                optimizationOptions?.rebalancePortfolio
                  ? "Full Optimization"
                  : optimizationOptions?.convertDust
                    ? "Convert Dust Tokens"
                    : "Rebalance Portfolio"}
              </button>
            )}
        </motion.div>
      )}
    </motion.div>
  );
};

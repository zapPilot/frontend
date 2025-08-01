"use client";

import { motion } from "framer-motion";
import { ArrowRightLeft, RotateCcw, Zap } from "lucide-react";
import { useCallback, useMemo } from "react";
import type { SwapToken } from "../../../types/swap";
import { SlippageComponent } from "../../shared/SlippageComponent";
import type {
  OperationMode,
  ProcessedAssetCategory,
  SwapSettings,
  SwapValidation,
} from "../types";
import { TokenSelector, ValidationMessages } from "./Controls";

interface SwapControlsProps {
  operationMode: OperationMode;
  swapSettings: SwapSettings;
  onSwapSettingsChange: (settings: SwapSettings) => void;
  includedCategories: ProcessedAssetCategory[];
  className?: string;
}

export const SwapControls: React.FC<SwapControlsProps> = ({
  operationMode,
  swapSettings,
  onSwapSettingsChange,
  includedCategories,
  className = "",
}) => {
  const handleTokenChange = useCallback(
    (field: "fromToken" | "toToken", token: SwapToken) => {
      onSwapSettingsChange({
        ...swapSettings,
        [field]: token,
      });
    },
    [swapSettings, onSwapSettingsChange]
  );

  const handleAmountChange = useCallback(
    (amount: string) => {
      onSwapSettingsChange({
        ...swapSettings,
        amount,
      });
    },
    [swapSettings, onSwapSettingsChange]
  );

  const handleSlippageChange = useCallback(
    (slippageTolerance: number) => {
      onSwapSettingsChange({
        ...swapSettings,
        slippageTolerance,
      });
    },
    [swapSettings, onSwapSettingsChange]
  );

  // Calculate portfolio value for display
  const totalPortfolioValue = useMemo(() => {
    return includedCategories.reduce((sum, cat) => sum + cat.totalValue, 0);
  }, [includedCategories]);

  // Validation logic
  const validation: SwapValidation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Amount validation
    if (!swapSettings.amount || parseFloat(swapSettings.amount) <= 0) {
      errors.push("Please enter a valid amount");
    }

    // Token validation based on operation mode
    if (operationMode === "zapIn" && !swapSettings.fromToken) {
      errors.push("Please select a token to zap in");
    }

    if (operationMode === "zapOut" && !swapSettings.toToken) {
      errors.push("Please select a token to receive");
    }

    // Balance validation for zapIn
    if (
      operationMode === "zapIn" &&
      swapSettings.fromToken &&
      swapSettings.amount
    ) {
      const amount = parseFloat(swapSettings.amount);
      if (amount > swapSettings.fromToken.balance) {
        errors.push("Insufficient balance");
      }
    }

    // Slippage warnings
    if (swapSettings.slippageTolerance > 5) {
      warnings.push("High slippage may result in unexpected losses");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [operationMode, swapSettings]);

  // Operation mode display configuration
  const modeConfig = useMemo(() => {
    switch (operationMode) {
      case "zapIn":
        return {
          title: "Zap In",
          subtitle: "Convert token to portfolio allocation",
          icon: <Zap className="w-5 h-5" />,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          showFromToken: true,
          showToToken: false,
          fromLabel: "From Token",
          fromPlaceholder: "Select token to convert",
        };
      case "zapOut":
        return {
          title: "Zap Out",
          subtitle: "Convert portfolio to single token",
          icon: <ArrowRightLeft className="w-5 h-5" />,
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          showFromToken: false,
          showToToken: true,
          toLabel: "To Token",
          toPlaceholder: "Select token to receive",
        };
      case "rebalance":
        return {
          title: "Rebalance",
          subtitle: "Optimize portfolio allocation",
          icon: <RotateCcw className="w-5 h-5" />,
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          showFromToken: false,
          showToToken: false,
        };
      default:
        return {
          title: "Portfolio Operation",
          subtitle: "",
          icon: <Zap className="w-5 h-5" />,
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          showFromToken: false,
          showToToken: false,
        };
    }
  }, [operationMode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900/30 rounded-2xl border border-gray-700 p-6 space-y-6 ${className}`}
      data-testid="swap-controls"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${modeConfig.bgColor}`}>
            <div className={modeConfig.color}>{modeConfig.icon}</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {modeConfig.title}
            </h3>
            <p className="text-sm text-gray-400">{modeConfig.subtitle}</p>
          </div>
        </div>

        {/* Slippage Settings */}
        <SlippageComponent
          value={swapSettings.slippageTolerance}
          onChange={handleSlippageChange}
          context="portfolio"
          variant="compact"
          dropdownPosition="left-center"
        />
      </div>

      {/* Token Selectors */}
      <div className="grid grid-cols-1 gap-4">
        {modeConfig.showFromToken && (
          <TokenSelector
            {...(swapSettings.fromToken
              ? { selectedToken: swapSettings.fromToken }
              : {})}
            onTokenSelect={token => handleTokenChange("fromToken", token)}
            label={modeConfig.fromLabel!}
            placeholder={modeConfig.fromPlaceholder!}
          />
        )}

        {modeConfig.showToToken && (
          <TokenSelector
            {...(swapSettings.toToken
              ? { selectedToken: swapSettings.toToken }
              : {})}
            onTokenSelect={token => handleTokenChange("toToken", token)}
            label={modeConfig.toLabel!}
            placeholder={modeConfig.toPlaceholder!}
          />
        )}
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-400">
          {operationMode === "zapIn"
            ? "Amount to Zap In"
            : operationMode === "zapOut"
              ? "Portfolio Value to Convert"
              : "Amount to Rebalance"}
        </label>
        <div className="relative">
          <input
            type="number"
            value={swapSettings.amount}
            onChange={e => handleAmountChange(e.target.value)}
            placeholder="0.0"
            min="0"
            step="0.01"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-lg placeholder-gray-500 focus:outline-none focus:border-purple-500"
            data-testid="amount-input"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
            {operationMode === "zapIn" && swapSettings.fromToken
              ? swapSettings.fromToken.symbol
              : operationMode === "zapOut"
                ? "USD"
                : operationMode === "rebalance"
                  ? "USD"
                  : ""}
          </div>
        </div>

        {/* Balance/Portfolio Info */}
        <div className="flex justify-between text-xs text-gray-400">
          {operationMode === "zapIn" && swapSettings.fromToken && (
            <span>
              Balance: {swapSettings.fromToken.balance.toFixed(4)}{" "}
              {swapSettings.fromToken.symbol}
            </span>
          )}
          {(operationMode === "zapOut" || operationMode === "rebalance") && (
            <span>
              Portfolio Value: ${totalPortfolioValue.toLocaleString()}
            </span>
          )}
          <button
            onClick={() => {
              if (operationMode === "zapIn" && swapSettings.fromToken) {
                handleAmountChange(swapSettings.fromToken.balance.toString());
              } else if (
                operationMode === "zapOut" ||
                operationMode === "rebalance"
              ) {
                handleAmountChange(totalPortfolioValue.toString());
              }
            }}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Max
          </button>
        </div>
      </div>

      {/* Portfolio Summary for ZapOut/Rebalance */}
      {(operationMode === "zapOut" || operationMode === "rebalance") && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3">
            {operationMode === "zapOut" ? "Converting From" : "Rebalancing"}{" "}
            Portfolio
          </h4>
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
        </div>
      )}

      {/* Validation Messages */}
      <ValidationMessages validation={validation} />
    </motion.div>
  );
};

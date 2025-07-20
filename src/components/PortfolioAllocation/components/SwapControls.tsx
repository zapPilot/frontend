"use client";

import { motion } from "framer-motion";
import { ChevronDown, ArrowRightLeft, Zap, RotateCcw } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { MOCK_TOKENS } from "../../../constants/swap";
import type { SwapToken } from "../../../types/swap";
import type {
  OperationMode,
  SwapSettings,
  SwapValidation,
  ProcessedAssetCategory,
} from "../types";
import { SlippageSettings } from "./SlippageSettings";

interface SwapControlsProps {
  operationMode: OperationMode;
  swapSettings: SwapSettings;
  onSwapSettingsChange: (settings: SwapSettings) => void;
  includedCategories: ProcessedAssetCategory[];
  className?: string;
}

interface TokenSelectorProps {
  selectedToken?: SwapToken;
  onTokenSelect: (token: SwapToken) => void;
  label: string;
  placeholder: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onTokenSelect,
  label,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-400 mb-2">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
        data-testid={`token-selector-${label.toLowerCase().replace(" ", "-")}`}
      >
        <div className="flex items-center space-x-3">
          {selectedToken ? (
            <>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {selectedToken.symbol.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <div className="text-white font-medium">
                  {selectedToken.symbol}
                </div>
                <div className="text-xs text-gray-400">
                  {selectedToken.name}
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* Token Dropdown */}
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-auto"
          >
            {MOCK_TOKENS.map(token => (
              <button
                key={token.symbol}
                onClick={() => {
                  onTokenSelect(token);
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 transition-colors"
                data-testid={`token-option-${token.symbol}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {token.symbol.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">{token.symbol}</div>
                  <div className="text-xs text-gray-400">{token.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-300">
                    {token.balance.toFixed(
                      token.symbol.includes("BTC") ||
                        token.symbol.includes("ETH")
                        ? 4
                        : 2
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    ${(token.balance * token.price).toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
};

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
        <SlippageSettings
          value={swapSettings.slippageTolerance}
          onChange={handleSlippageChange}
        />
      </div>

      {/* Token Selectors */}
      <div className="grid grid-cols-1 gap-4">
        {modeConfig.showFromToken && (
          <TokenSelector
            selectedToken={swapSettings.fromToken}
            onTokenSelect={token => handleTokenChange("fromToken", token)}
            label={modeConfig.fromLabel!}
            placeholder={modeConfig.fromPlaceholder!}
          />
        )}

        {modeConfig.showToToken && (
          <TokenSelector
            selectedToken={swapSettings.toToken}
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
      {(!validation.isValid || validation.warnings.length > 0) && (
        <div className="space-y-2">
          {validation.errors.map((error, index) => (
            <div
              key={index}
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
            >
              {error}
            </div>
          ))}
          {validation.warnings.map((warning, index) => (
            <div
              key={index}
              className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3"
            >
              {warning}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

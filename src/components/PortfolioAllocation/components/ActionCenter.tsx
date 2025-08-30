"use client";

import { motion } from "framer-motion";
import { ArrowRightLeft, Coins, RotateCcw, Settings, Zap } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { SwapToken } from "../../../types/swap";
import { formatSmallCurrency } from "../../../lib/formatters";
import {
  calculateTotalTokenValue,
  getTokenSymbol,
} from "../../../utils/tokenUtils";
import { SlippageComponent } from "../../shared/SlippageComponent";
import { TokenImage } from "../../shared/TokenImage";
import { OptimizationOptions, DustToken } from "../../../types/optimize";
import type {
  OperationMode,
  ProcessedAssetCategory,
  SwapSettings,
  SwapValidation,
} from "../types";
import { AmountInput, TokenSelector, ValidationMessages } from "./Controls";

// Action framework types
export type ActionType =
  | "zapIn"
  | "zapOut"
  | "rebalance"
  | "convertDust"
  | "optimize";

export interface ActionDefinition {
  id: ActionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  complexity: "simple" | "advanced";
  color: string;
  bgColor: string;
}

interface ActionCenterProps {
  operationMode: OperationMode;
  swapSettings: SwapSettings;
  onSwapSettingsChange: (settings: SwapSettings) => void;
  includedCategories: ProcessedAssetCategory[];
  // Optimization-specific props (optional)
  optimizationOptions?: OptimizationOptions;
  onOptimizationOptionsChange?: (options: OptimizationOptions) => void;
  dustTokens?: DustToken[];
  loadingTokens?: boolean;
  className?: string;
}

// Action definitions
const ACTION_DEFINITIONS: ActionDefinition[] = [
  {
    id: "zapIn",
    title: "Zap In",
    description: "Convert token to portfolio allocation",
    icon: <Zap className="w-5 h-5" />,
    complexity: "simple",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  {
    id: "zapOut",
    title: "Zap Out",
    description: "Convert portfolio to single token",
    icon: <ArrowRightLeft className="w-5 h-5" />,
    complexity: "simple",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  {
    id: "rebalance",
    title: "Rebalance",
    description: "Optimize portfolio allocation",
    icon: <RotateCcw className="w-5 h-5" />,
    complexity: "simple",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  {
    id: "convertDust",
    title: "Convert Dust",
    description: "Convert small token balances to ETH",
    icon: <Coins className="w-5 h-5" />,
    complexity: "advanced",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  {
    id: "optimize",
    title: "Full Optimization",
    description: "Convert dust + rebalance portfolio",
    icon: <Settings className="w-5 h-5" />,
    complexity: "advanced",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
];

export const ActionCenter: React.FC<ActionCenterProps> = ({
  operationMode,
  swapSettings,
  onSwapSettingsChange,
  includedCategories,
  optimizationOptions,
  onOptimizationOptionsChange,
  dustTokens = [],
  loadingTokens = false,
  className = "",
}) => {
  // Determine current action based on operation mode and optimization options
  const getCurrentAction = (): ActionType => {
    if (operationMode === "rebalance") {
      if (
        optimizationOptions?.convertDust &&
        optimizationOptions?.rebalancePortfolio
      ) {
        return "optimize";
      } else if (optimizationOptions?.convertDust) {
        return "convertDust";
      } else if (optimizationOptions?.rebalancePortfolio) {
        return "rebalance";
      }
      return "rebalance";
    }
    return operationMode as ActionType;
  };

  const [selectedAction, setSelectedAction] =
    useState<ActionType>(getCurrentAction());
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Filter actions based on operation mode
  const availableActions = useMemo(() => {
    const actions = ACTION_DEFINITIONS.filter(action => {
      if (operationMode === "rebalance") {
        // In rebalance mode, show optimization actions
        return ["rebalance", "convertDust", "optimize"].includes(action.id);
      } else {
        // In other modes, show simple swap actions
        return ["zapIn", "zapOut"].includes(action.id);
      }
    });

    return showAdvanced
      ? actions
      : actions.filter(a => a.complexity === "simple");
  }, [operationMode, showAdvanced]);

  const currentActionDef = ACTION_DEFINITIONS.find(
    a => a.id === selectedAction
  );

  // Handle action selection
  const handleActionSelect = useCallback(
    (action: ActionType) => {
      setSelectedAction(action);

      // Update optimization options based on action
      if (onOptimizationOptionsChange && operationMode === "rebalance") {
        const newOptions = { ...optimizationOptions } as OptimizationOptions;

        switch (action) {
          case "convertDust":
            newOptions.convertDust = true;
            newOptions.rebalancePortfolio = false;
            break;
          case "rebalance":
            newOptions.convertDust = false;
            newOptions.rebalancePortfolio = true;
            break;
          case "optimize":
            newOptions.convertDust = true;
            newOptions.rebalancePortfolio = true;
            break;
        }

        onOptimizationOptionsChange(newOptions);
      }
    },
    [optimizationOptions, onOptimizationOptionsChange, operationMode]
  );

  // Standard swap controls handlers
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

  // Validation logic
  const validation: SwapValidation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Simple swap validation
    if (selectedAction === "zapIn" || selectedAction === "zapOut") {
      if (!swapSettings.amount || parseFloat(swapSettings.amount) <= 0) {
        errors.push("Please enter a valid amount");
      }

      if (selectedAction === "zapIn" && !swapSettings.fromToken) {
        errors.push("Please select a token to zap in");
      }

      if (selectedAction === "zapOut" && !swapSettings.toToken) {
        errors.push("Please select a token to receive");
      }

      // Balance validation for zapIn
      if (
        selectedAction === "zapIn" &&
        swapSettings.fromToken &&
        swapSettings.amount
      ) {
        const amount = parseFloat(swapSettings.amount);
        if (amount > swapSettings.fromToken.balance) {
          errors.push("Insufficient balance");
        }
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
  }, [selectedAction, swapSettings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
      data-testid="action-center"
    >
      {/* Action Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-white">Choose Action</h4>
          {operationMode === "rebalance" && (
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showAdvanced ? "Simple" : "Advanced"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {availableActions.map(action => (
            <button
              key={action.id}
              onClick={() => handleActionSelect(action.id)}
              className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 text-left ${
                selectedAction === action.id
                  ? `${action.bgColor} border border-current ${action.color}`
                  : "bg-gray-900/30 border border-gray-700 hover:bg-gray-900/50 text-gray-300"
              }`}
            >
              <div className={`p-2 rounded-lg ${action.bgColor}`}>
                <div className={action.color}>{action.icon}</div>
              </div>
              <div className="flex-1">
                <div className="font-medium">{action.title}</div>
                <div className="text-sm opacity-75">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Configuration */}
      {currentActionDef && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${currentActionDef.bgColor}`}>
                <div className={currentActionDef.color}>
                  {currentActionDef.icon}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {currentActionDef.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {currentActionDef.description}
                </p>
              </div>
            </div>

            {/* Slippage Settings */}
            <SlippageComponent
              value={
                optimizationOptions?.slippage || swapSettings.slippageTolerance
              }
              onChange={
                operationMode === "rebalance" && onOptimizationOptionsChange
                  ? slippage =>
                      onOptimizationOptionsChange({
                        ...(optimizationOptions || {
                          convertDust: false,
                          rebalancePortfolio: true,
                          slippage: 30,
                        }),
                        slippage,
                      })
                  : handleSlippageChange
              }
              context={operationMode === "rebalance" ? "swap" : "portfolio"}
              variant="compact"
              dropdownPosition="left-center"
            />
          </div>

          {/* Configuration Content */}
          {(selectedAction === "zapIn" || selectedAction === "zapOut") && (
            <>
              {/* Token Selectors */}
              <div className="grid grid-cols-1 gap-4">
                {selectedAction === "zapIn" && (
                  <TokenSelector
                    {...(swapSettings.fromToken
                      ? { selectedToken: swapSettings.fromToken }
                      : {})}
                    onTokenSelect={token =>
                      handleTokenChange("fromToken", token)
                    }
                    label="From Token"
                    placeholder="Select token to convert"
                  />
                )}

                {selectedAction === "zapOut" && (
                  <TokenSelector
                    {...(swapSettings.toToken
                      ? { selectedToken: swapSettings.toToken }
                      : {})}
                    onTokenSelect={token => handleTokenChange("toToken", token)}
                    label="To Token"
                    placeholder="Select token to receive"
                  />
                )}
              </div>

              {/* Amount Input */}
              <AmountInput
                operationMode={selectedAction as OperationMode}
                amount={swapSettings.amount}
                onAmountChange={handleAmountChange}
                fromToken={swapSettings.fromToken!}
                totalPortfolioValue={totalPortfolioValue}
              />
            </>
          )}

          {/* Optimization Information */}
          {(selectedAction === "convertDust" ||
            selectedAction === "optimize") && (
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center space-x-3">
                <Coins className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <div className="font-medium text-white">Dust Conversion</div>
                  <div className="text-sm text-gray-400">
                    {loadingTokens ? (
                      "Loading dust tokens..."
                    ) : dustTokenData.dustTokenCount > 0 ? (
                      <>
                        Convert {dustTokenData.dustTokenCount} small token
                        balances worth{" "}
                        {formatSmallCurrency(dustTokenData.dustValue)}
                      </>
                    ) : (
                      "No dust tokens found"
                    )}
                  </div>
                  {/* Token Previews */}
                  {dustTokenData.dustTokenCount > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-xs text-gray-400">Tokens:</div>
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
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-500">
                    {loadingTokens
                      ? "..."
                      : formatSmallCurrency(dustTokenData.dustValue)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {dustTokenData.dustTokenCount} tokens
                  </div>
                </div>
              </div>
            </div>
          )}

          {(selectedAction === "rebalance" ||
            selectedAction === "optimize") && (
            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center space-x-3">
                <RotateCcw className="w-5 h-5 text-purple-500" />
                <div className="flex-1">
                  <div className="font-medium text-white">
                    Portfolio Rebalance
                  </div>
                  <div className="text-sm text-gray-400">
                    Optimize allocation across multiple chains with estimated
                    actions
                  </div>
                  <div className="text-xs text-purple-400 mt-1">
                    Estimated improvement: +2.3% APR efficiency
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-500">3</div>
                  <div className="text-xs text-gray-400">actions</div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Messages */}
          <ValidationMessages validation={validation} />
        </div>
      )}
    </motion.div>
  );
};

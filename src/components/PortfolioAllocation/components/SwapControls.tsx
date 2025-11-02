"use client";

import { motion } from "framer-motion";
import { ArrowRightLeft, RotateCcw, Zap } from "lucide-react";
import {
  forwardRef,
  type Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { useUser } from "../../../contexts/UserContext";
import type { SwapToken } from "../../../types/swap";
import { SlippageComponent } from "../../shared/SlippageComponent";
import type {
  OperationMode,
  ProcessedAssetCategory,
  SwapSettings,
  SwapValidation,
} from "../types";
import {
  AmountInput,
  TokenSelector,
  ValidationMessages,
} from "./ActionsAndControls";

interface SwapControlsProps {
  operationMode: OperationMode;
  swapSettings: SwapSettings;
  onSwapSettingsChange: (settings: SwapSettings) => void;
  includedCategories: ProcessedAssetCategory[];
  className?: string;
  chainId?: number;
}

export interface SwapControlsRef {
  attemptValidation: () => void;
  resetValidation: () => void;
}

export const SwapControls = forwardRef<SwapControlsRef, SwapControlsProps>(
  (
    {
      operationMode,
      swapSettings,
      onSwapSettingsChange,
      includedCategories,
      className = "",
      chainId,
    },
    ref: Ref<SwapControlsRef>
  ) => {
    const { connectedWallet } = useUser();
    const walletAddress = connectedWallet;
    const [validationAttempted, setValidationAttempted] = useState(false);
    const [validationMode, setValidationMode] = useState<
      "onSubmit" | "onChange"
    >("onSubmit");

    // Function to trigger validation attempt
    const attemptValidation = useCallback(() => {
      setValidationAttempted(true);
      setValidationMode("onChange"); // Switch to real-time validation after first attempt
    }, []);

    // Function to reset validation state
    const resetValidation = useCallback(() => {
      setValidationAttempted(false);
      setValidationMode("onSubmit");
    }, []);

    // Reset validation when key form fields change (after first attempt)
    const resetValidationOnChange = useCallback(() => {
      if (validationAttempted && validationMode === "onChange") {
        // In onChange mode, reset validation when user makes corrections
        setValidationAttempted(false);
      }
    }, [validationAttempted, validationMode]);

    // Track changes to reset validation appropriately
    const prevSwapSettingsRef = useRef(swapSettings);
    if (prevSwapSettingsRef.current !== swapSettings) {
      resetValidationOnChange();
      prevSwapSettingsRef.current = swapSettings;
    }

    // Expose the validation functions to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        attemptValidation,
        resetValidation,
      }),
      [attemptValidation, resetValidation]
    );

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

    const handleOptimizationChange = useCallback(
      (option: "dustZap" | "rebalance", checked: boolean) => {
        const currentOptions = swapSettings.optimizationOptions || {
          dustZap: false,
          rebalance: false,
        };

        onSwapSettingsChange({
          ...swapSettings,
          optimizationOptions: {
            ...currentOptions,
            [option]: checked,
          },
        });
      },
      [swapSettings, onSwapSettingsChange]
    );

    // Calculate portfolio value for display
    const totalPortfolioValue = useMemo(() => {
      return includedCategories.reduce((sum, cat) => sum + cat.totalValue, 0);
    }, [includedCategories]);

    // Validation logic - progressive validation based on mode
    const validation: SwapValidation = useMemo(() => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Progressive validation: show errors based on validation mode
      const shouldShowErrors =
        validationAttempted || validationMode === "onChange";

      if (shouldShowErrors) {
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
          swapSettings.amount &&
          swapSettings.fromToken.balance !== undefined
        ) {
          const amount = parseFloat(swapSettings.amount);
          if (amount > swapSettings.fromToken.balance) {
            errors.push("Insufficient balance");
          }
        }
      }

      // Slippage warnings - always show these
      if (swapSettings.slippageTolerance > 5) {
        warnings.push("High slippage may result in unexpected losses");
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    }, [operationMode, swapSettings, validationAttempted, validationMode]);

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

        {/* Optimization Options - Only for rebalance mode */}
        {operationMode === "rebalance" && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">
              Optimization Options
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {/* Dust Zap Checkbox */}
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={swapSettings.optimizationOptions?.dustZap || false}
                    onChange={e =>
                      handleOptimizationChange("dustZap", e.target.checked)
                    }
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                      swapSettings.optimizationOptions?.dustZap
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-400 group-hover:border-blue-400"
                    }`}
                  >
                    {swapSettings.optimizationOptions?.dustZap && (
                      <svg
                        className="w-3 h-3 text-white absolute top-0.5 left-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Dust Zap</div>
                  <div className="text-xs text-gray-400">
                    Convert small token balances to ETH
                  </div>
                </div>
              </label>

              {/* Rebalance Checkbox */}
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={
                      swapSettings.optimizationOptions?.rebalance || false
                    }
                    onChange={e =>
                      handleOptimizationChange("rebalance", e.target.checked)
                    }
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                      swapSettings.optimizationOptions?.rebalance
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-400 group-hover:border-blue-400"
                    }`}
                  >
                    {swapSettings.optimizationOptions?.rebalance && (
                      <svg
                        className="w-3 h-3 text-white absolute top-0.5 left-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    Rebalance
                  </div>
                  <div className="text-xs text-gray-400">
                    Optimize portfolio allocation
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Token Selectors */}
        <div className="grid grid-cols-1 gap-4">
          {modeConfig.showFromToken && (
            <TokenSelector
              {...(swapSettings.fromToken
                ? { selectedToken: swapSettings.fromToken }
                : {})}
              {...(chainId !== undefined ? { chainId } : {})}
              walletAddress={walletAddress}
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
              {...(chainId !== undefined ? { chainId } : {})}
              walletAddress={walletAddress}
              onTokenSelect={token => handleTokenChange("toToken", token)}
              label={modeConfig.toLabel!}
              placeholder={modeConfig.toPlaceholder!}
            />
          )}
        </div>

        {/* Amount Input */}
        <AmountInput
          operationMode={operationMode}
          amount={swapSettings.amount}
          onAmountChange={handleAmountChange}
          {...(swapSettings.fromToken && { fromToken: swapSettings.fromToken })}
          totalPortfolioValue={totalPortfolioValue}
        />
        {/* Validation Messages */}
        <ValidationMessages validation={validation} />
      </motion.div>
    );
  }
);

SwapControls.displayName = "SwapControls";

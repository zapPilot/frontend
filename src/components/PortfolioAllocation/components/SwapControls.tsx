"use client";

import { motion } from "framer-motion";
import { ArrowRightLeft, RotateCcw, Zap } from "lucide-react";
import React, {
  forwardRef,
  type Ref,
  useImperativeHandle,
  useMemo,
} from "react";

import { useUser } from "../../../contexts/UserContext";
import { SlippageComponent } from "../../shared/SlippageComponent";
import type {
  OperationMode,
  ProcessedAssetCategory,
  SwapSettings,
} from "../types";
import {
  AmountInput,
  TokenSelector,
  ValidationMessages,
} from "./ActionsAndControls";
import { useSwapControlsState } from "./useSwapControlsState";

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

interface OptimizationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
  "data-testid"?: string;
}

const CHECK_ICON_PATH =
  "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z";

const DEFAULT_FROM_LABEL = "From Token";
const DEFAULT_FROM_PLACEHOLDER = "Select token to convert";
const DEFAULT_TO_LABEL = "To Token";
const DEFAULT_TO_PLACEHOLDER = "Select token to receive";

interface ModeConfig {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  showFromToken: boolean;
  showToToken: boolean;
  fromLabel?: string;
  fromPlaceholder?: string;
  toLabel?: string;
  toPlaceholder?: string;
}

const getModeConfig = (operationMode: OperationMode): ModeConfig => {
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
        fromLabel: DEFAULT_FROM_LABEL,
        fromPlaceholder: DEFAULT_FROM_PLACEHOLDER,
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
        toLabel: DEFAULT_TO_LABEL,
        toPlaceholder: DEFAULT_TO_PLACEHOLDER,
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
};

const OptimizationToggle = ({
  label,
  description,
  checked,
  onToggle,
  disabled = false,
  "data-testid": testId,
}: OptimizationToggleProps) => (
  <label
    className="flex items-center space-x-3 cursor-pointer group"
    data-testid={testId}
  >
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onToggle(event.target.checked)}
        className="sr-only"
        disabled={disabled}
      />
      <div
        className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
          checked
            ? "bg-blue-500 border-blue-500"
            : "border-gray-400 group-hover:border-blue-400"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white absolute top-0.5 left-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d={CHECK_ICON_PATH} clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
    <div className="flex-1">
      <div className="text-sm font-medium text-white">{label}</div>
      <div className="text-xs text-gray-400">{description}</div>
    </div>
  </label>
);

const SwapControlsComponent = forwardRef<SwapControlsRef, SwapControlsProps>(
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
    const {
      validation,
      attemptValidation,
      resetValidation,
      handleTokenChange,
      handleAmountChange,
      handleSlippageChange,
      handleOptimizationChange,
      totalPortfolioValue,
    } = useSwapControlsState({
      operationMode,
      swapSettings,
      onSwapSettingsChange,
      includedCategories,
    });

    // Expose the validation functions to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        attemptValidation,
        resetValidation,
      }),
      [attemptValidation, resetValidation]
    );

    // Operation mode display configuration
    const modeConfig = useMemo(
      () => getModeConfig(operationMode),
      [operationMode]
    );

    const fromLabel = modeConfig.fromLabel ?? DEFAULT_FROM_LABEL;
    const fromPlaceholder =
      modeConfig.fromPlaceholder ?? DEFAULT_FROM_PLACEHOLDER;
    const toLabel = modeConfig.toLabel ?? DEFAULT_TO_LABEL;
    const toPlaceholder = modeConfig.toPlaceholder ?? DEFAULT_TO_PLACEHOLDER;

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
              <OptimizationToggle
                label="Dust Zap"
                description="Convert small token balances to ETH"
                checked={swapSettings.optimizationOptions?.dustZap ?? false}
                onToggle={checked =>
                  handleOptimizationChange("dustZap", checked)
                }
                data-testid="dust-zap-toggle"
              />

              <OptimizationToggle
                label="Rebalance"
                description="Optimize portfolio allocation"
                checked={swapSettings.optimizationOptions?.rebalance ?? false}
                onToggle={checked =>
                  handleOptimizationChange("rebalance", checked)
                }
                data-testid="rebalance-toggle"
              />
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
              label={fromLabel}
              placeholder={fromPlaceholder}
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
              label={toLabel}
              placeholder={toPlaceholder}
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

SwapControlsComponent.displayName = "SwapControls";

export const SwapControls = React.memo(SwapControlsComponent);

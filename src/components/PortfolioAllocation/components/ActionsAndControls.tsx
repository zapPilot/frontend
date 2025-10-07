"use client";

import { TokenImage } from "@/components/shared/TokenImage";
import { GradientButton } from "@/components/ui";
import { GRADIENTS, Z_INDEX } from "@/constants/design-system";
import { useDropdown } from "@/hooks";
import {
  useZapTokensWithStates,
  type UseZapTokensWithStatesOptions,
} from "@/hooks/queries/useZapTokensQuery";
import { formatCurrency, formatTokenAmount } from "@/lib/formatters";
import type { SwapToken } from "@/types/swap";
import { motion } from "framer-motion";
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type {
  OperationMode,
  ProcessedAssetCategory,
  RebalanceMode,
  SwapValidation,
} from "../types";

// =============================================================================
// ACTION BUTTON COMPONENT (was in Actions/ActionButton.tsx)
// =============================================================================

interface ActionButtonProps {
  operationMode: OperationMode;
  includedCategories: ProcessedAssetCategory[];
  rebalanceMode?: RebalanceMode | undefined;
  onAction?: (() => void) | undefined;
  isEnabled?: boolean | undefined;
  disabledReason?: string | undefined;
}

const getActionButtonText = (
  operationMode: OperationMode,
  includedCount: number,
  rebalanceChanges: number
): string => {
  if (operationMode === "rebalance") {
    return `Execute Rebalance (${rebalanceChanges} changes)`;
  }

  if (operationMode === "zapIn") {
    return includedCount === 0
      ? "Select categories to Zap In"
      : `Zap In to ${includedCount} categor${includedCount === 1 ? "y" : "ies"}`;
  }

  if (operationMode === "zapOut") {
    return includedCount === 0
      ? "Select categories to Zap Out"
      : `Zap Out from ${includedCount} categor${includedCount === 1 ? "y" : "ies"}`;
  }

  return includedCount === 0
    ? "Select categories"
    : `Execute with ${includedCount} categor${includedCount === 1 ? "y" : "ies"}`;
};

export const ActionButton = memo<ActionButtonProps>(
  ({
    operationMode,
    includedCategories,
    rebalanceMode,
    onAction,
    isEnabled = true,
    disabledReason,
  }) => {
    const changesCount =
      rebalanceMode?.data?.shifts.filter(s => s.action !== "maintain").length ||
      0;
    const buttonText = getActionButtonText(
      operationMode,
      includedCategories.length,
      changesCount
    );

    return (
      <div className="pt-4">
        <GradientButton
          {...(onAction && { onClick: onAction })}
          gradient={GRADIENTS.PRIMARY}
          disabled={includedCategories.length === 0 || !isEnabled}
          className="w-full py-4 px-6 hover:from-purple-500 hover:to-blue-500 disabled:opacity-60"
          testId="zap-action-button"
        >
          {buttonText}
        </GradientButton>
        {!isEnabled && disabledReason && (
          <p
            className="mt-2 text-xs text-red-400"
            data-testid="action-disabled-reason"
          >
            {disabledReason}
          </p>
        )}
      </div>
    );
  }
);

ActionButton.displayName = "ActionButton";

// =============================================================================
// TOKEN SELECTOR COMPONENT (was in Controls/TokenSelection/TokenSelector.tsx)
// =============================================================================

interface TokenSelectorProps {
  selectedToken?: SwapToken;
  onTokenSelect: (token: SwapToken) => void;
  label: string;
  placeholder: string;
  chainId?: number;
  walletAddress?: string | null;
}

export const TokenSelector = memo<TokenSelectorProps>(
  ({
    selectedToken,
    onTokenSelect,
    label,
    placeholder,
    chainId,
    walletAddress,
  }) => {
    const dropdown = useDropdown(false);
    const zapTokensOptions = useMemo(() => {
      const base: UseZapTokensWithStatesOptions = {
        balanceEnabled: !!walletAddress,
      };

      if (typeof chainId === "number") {
        base.chainId = chainId;
      }

      if (walletAddress !== undefined) {
        base.walletAddress = walletAddress;
      }

      return base;
    }, [walletAddress, chainId]);

    const {
      tokens,
      hasTokens,
      isEmpty,
      isInitialLoading,
      isError,
      error,
      refetch,
      isRefetching,
      isBalanceLoading,
      isBalanceFetching,
      balanceError,
    } = useZapTokensWithStates(zapTokensOptions);
    return (
      <div className="relative">
        <label className="block text-xs font-medium text-gray-400 mb-2">
          {label}
        </label>
        <button
          onClick={dropdown.toggle}
          className="w-full flex items-center justify-between p-3 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          data-testid={`token-selector-${label.toLowerCase().replace(" ", "-")}`}
        >
          <div className="flex items-center space-x-3">
            {selectedToken ? (
              <>
                <TokenImage
                  token={{
                    symbol: selectedToken.symbol,
                    ...(selectedToken.optimized_symbol && {
                      optimized_symbol: selectedToken.optimized_symbol,
                    }),
                    ...(selectedToken.logo_url && {
                      logo_url: selectedToken.logo_url,
                    }),
                  }}
                  size={32}
                  className="w-8 h-8"
                />
                <div className="text-left flex flex-col space-y-0.5">
                  <div className="text-white font-medium">
                    {selectedToken.symbol}
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedToken.name}
                  </div>
                  {selectedToken.balance !== undefined && (
                    <div className="text-xs text-gray-300">
                      {formatTokenAmount(
                        selectedToken.balance,
                        selectedToken.symbol
                      )}
                    </div>
                  )}
                  {selectedToken.price &&
                    selectedToken.balance !== undefined && (
                      <div className="text-xs text-gray-500">
                        {formatCurrency(
                          selectedToken.balance * selectedToken.price
                        )}
                      </div>
                    )}
                </div>
              </>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {dropdown.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl ${Z_INDEX.TOAST} max-h-64 overflow-auto`}
            >
              {/* Loading State */}
              {isInitialLoading && (
                <div className="space-y-2 p-2">
                  {Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-700 rounded animate-pulse mb-1" />
                          <div className="h-3 bg-gray-700 rounded animate-pulse w-2/3" />
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Error State */}
              {isError && (
                <div className="p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <div className="text-sm text-red-400 mb-2">
                    Failed to load tokens
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {error?.message || "Unknown error"}
                  </div>
                  <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="inline-flex items-center space-x-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isRefetching ? "animate-spin" : ""}`}
                    />
                    <span>{isRefetching ? "Retrying..." : "Retry"}</span>
                  </button>
                </div>
              )}

              {/* Empty State */}
              {isEmpty && (
                <div className="p-4 text-center text-gray-500">
                  <div className="text-sm mb-1">No tokens available</div>
                  <div className="text-xs">
                    Try switching to a different network
                  </div>
                </div>
              )}

              {/* Token List */}
              {hasTokens &&
                tokens.map(token => (
                  <button
                    key={`${token.chainId}-${token.address}`}
                    onClick={() => {
                      onTokenSelect(token);
                      dropdown.close();
                    }}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 transition-colors"
                    data-testid={`token-option-${token.symbol}`}
                  >
                    <TokenImage
                      token={{
                        symbol: token.symbol,
                        ...(token.optimized_symbol && {
                          optimized_symbol: token.optimized_symbol,
                        }),
                        ...(token.logo_url && { logo_url: token.logo_url }),
                      }}
                      size={32}
                      className="w-8 h-8"
                    />
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">
                        {token.symbol}
                      </div>
                      <div className="text-xs text-gray-400">{token.name}</div>
                    </div>
                    {/* Balance display when available */}
                    {token.balance !== undefined && (
                      <div className="text-right">
                        <div className="text-sm text-gray-300">
                          {formatTokenAmount(token.balance, token.symbol)}
                        </div>
                        {token.price && (
                          <div className="text-xs text-gray-500">
                            {formatCurrency(token.balance * token.price)}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}

              {/* Balance Loading Indicator */}
              {(isBalanceLoading || isBalanceFetching) && !isInitialLoading && (
                <div className="p-3 text-xs text-gray-500">
                  Fetching balances...
                </div>
              )}

              {balanceError && !isBalanceLoading && !isBalanceFetching && (
                <div className="p-3 text-xs text-red-400">
                  Unable to refresh token balances. Balances may be outdated.
                </div>
              )}
            </motion.div>
            <div
              className={`fixed inset-0 ${Z_INDEX.HEADER}`}
              onClick={() => dropdown.close()}
            />
          </>
        )}
      </div>
    );
  }
);

TokenSelector.displayName = "TokenSelector";

// =============================================================================
// AMOUNT INPUT COMPONENT (was in Controls/AmountInput.tsx)
// =============================================================================

// Helper functions for precise decimal handling
function constrainValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseInputValue(input: string): number {
  const parsed = parseFloat(input);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Smart decimal formatter for crypto amounts
 * - Values >= 1: show 2 decimals (e.g., 10.25)
 * - Values < 1: show up to 6 decimals (e.g., 0.001234)
 * - Removes trailing zeros (e.g., 0.001000 → 0.001)
 */
function formatCryptoAmount(value: number): string {
  if (value === 0) return "0";

  // For values >= 1, use 2 decimals
  if (value >= 1) {
    return value.toFixed(2);
  }

  // For values < 1, use up to 6 decimals and remove trailing zeros
  const formatted = value.toFixed(6);
  // Remove trailing zeros and trailing decimal point
  return formatted.replace(/\.?0+$/, "");
}

interface AmountInputProps {
  operationMode: OperationMode;
  amount: string;
  onAmountChange: (amount: string) => void;
  fromToken?: SwapToken;
  totalPortfolioValue: number;
  className?: string;
  // Enhanced props with smart defaults
  step?: number;
  minAmount?: number;
  disabled?: boolean;
  placeholder?: string;
}

export const AmountInput = memo<AmountInputProps>(
  ({
    operationMode,
    amount,
    onAmountChange,
    fromToken,
    totalPortfolioValue,
    className = "",
    step = 0.01,
    minAmount = 0,
    disabled = false,
    placeholder = "0.00",
  }) => {
    // Determine max value based on operation mode
    const maxAmount = useMemo(() => {
      if (operationMode === "zapOut") {
        return totalPortfolioValue;
      }
      if (
        operationMode === "zapIn" &&
        fromToken &&
        fromToken.balance !== undefined
      ) {
        return fromToken.balance;
      }
      return Infinity;
    }, [operationMode, totalPortfolioValue, fromToken]);

    // Local state for input display (allows partial input like "0.")
    const [inputValue, setInputValue] = useState(amount);

    // Sync with external amount prop
    useEffect(() => {
      setInputValue(amount);
    }, [amount]);

    // Handle input change with validation
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;

        // Allow empty input
        if (rawValue === "") {
          setInputValue("");
          onAmountChange("0");
          return;
        }

        // Allow partial decimal input (e.g., "0.", "10.")
        if (/^\d*\.?\d*$/.test(rawValue)) {
          setInputValue(rawValue);

          // Only update parent if it's a valid number
          const numValue = parseFloat(rawValue);
          if (!isNaN(numValue)) {
            const constrained = constrainValue(numValue, minAmount, maxAmount);
            onAmountChange(constrained.toString());
          }
        }
      },
      [onAmountChange, minAmount, maxAmount]
    );

    // Handle blur - cleanup partial inputs
    const handleBlur = useCallback(() => {
      const numValue = parseInputValue(inputValue);
      const constrained = constrainValue(numValue, minAmount, maxAmount);
      const formatted = formatCryptoAmount(constrained);

      setInputValue(formatted);
      onAmountChange(formatted);
    }, [inputValue, minAmount, maxAmount, onAmountChange]);

    // Increment handler
    const handleIncrement = useCallback(() => {
      const current = parseInputValue(inputValue);
      const incremented = current + step;
      const constrained = constrainValue(incremented, minAmount, maxAmount);
      const formatted = formatCryptoAmount(constrained);

      setInputValue(formatted);
      onAmountChange(formatted);
    }, [inputValue, step, minAmount, maxAmount, onAmountChange]);

    // Decrement handler
    const handleDecrement = useCallback(() => {
      const current = parseInputValue(inputValue);
      const decremented = current - step;
      const constrained = constrainValue(decremented, minAmount, maxAmount);
      const formatted = formatCryptoAmount(constrained);

      setInputValue(formatted);
      onAmountChange(formatted);
    }, [inputValue, step, minAmount, maxAmount, onAmountChange]);

    // Max button handler - use exact amount to avoid precision loss
    const handleMax = useCallback(() => {
      // Use the exact maxAmount without formatting to prevent transaction failures
      // due to insufficient balance from rounding
      const exactAmount = maxAmount.toString();

      setInputValue(exactAmount);
      onAmountChange(exactAmount);
    }, [maxAmount, onAmountChange]);

    // Keyboard navigation for increment/decrement
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          handleIncrement();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          handleDecrement();
        }
      },
      [handleIncrement, handleDecrement]
    );

    // Check if at boundaries
    const isAtMin = parseInputValue(inputValue) <= minAmount;
    const isAtMax = parseInputValue(inputValue) >= maxAmount;

    // Display label and balance based on operation mode
    const balanceLabel =
      operationMode === "zapOut" ? "Portfolio Value" : "Balance";
    const displayBalance =
      operationMode === "zapOut"
        ? formatCurrency(totalPortfolioValue)
        : fromToken && fromToken.balance !== undefined
          ? `${formatTokenAmount(fromToken.balance, fromToken.symbol)}`
          : formatCurrency(0);

    return (
      <div className={`space-y-2 ${className}`}>
        {/* Label row */}
        <div className="flex justify-between items-center text-sm">
          <label htmlFor="amount-input" className="text-gray-400 font-medium">
            Amount
          </label>
          <div className="text-gray-400">
            {balanceLabel}: <span className="text-white">{displayBalance}</span>
          </div>
        </div>

        {/* Input row with controls */}
        <div className="relative">
          {/* Decrement button */}
          <motion.button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || isAtMin}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              absolute left-3 top-1/2 -translate-y-1/2 z-10
              w-8 h-8 rounded-lg
              flex items-center justify-center
              transition-all duration-200
              ${
                disabled || isAtMin
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-white hover:from-purple-500/30 hover:to-blue-500/30"
              }
            `}
            aria-label="Decrease amount"
            aria-disabled={disabled || isAtMin}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>

          {/* Input field */}
          <input
            id="amount-input"
            type="number"
            inputMode="decimal"
            role="spinbutton"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            step={step}
            min={minAmount}
            max={maxAmount}
            className={`
              w-full h-14 px-14
              bg-black/30 backdrop-blur-sm
              border border-purple-500/20
              rounded-xl
              text-white text-center text-lg font-medium
              placeholder:text-gray-600
              focus:outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/20
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              [appearance:textfield]
              [&::-webkit-outer-spin-button]:appearance-none
              [&::-webkit-inner-spin-button]:appearance-none
            `}
            aria-label="Amount input"
            aria-describedby="amount-balance"
            aria-valuemin={minAmount}
            aria-valuemax={maxAmount}
            aria-valuenow={parseInputValue(inputValue)}
            data-testid="amount-input"
          />

          {/* Increment button */}
          <motion.button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || isAtMax}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              absolute right-3 top-1/2 -translate-y-1/2 z-10
              w-8 h-8 rounded-lg
              flex items-center justify-center
              transition-all duration-200
              ${
                disabled || isAtMax
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-white hover:from-purple-500/30 hover:to-blue-500/30"
              }
            `}
            aria-label="Increase amount"
            aria-disabled={disabled || isAtMax}
          >
            <ChevronUp className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Max button */}
        <motion.button
          type="button"
          onClick={handleMax}
          disabled={disabled || isAtMax}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full h-10 rounded-lg
            text-sm font-medium
            transition-all duration-200
            ${
              disabled || isAtMax
                ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-300 hover:from-purple-500/20 hover:to-blue-500/20"
            }
          `}
          aria-label="Set to maximum amount"
        >
          Max: {displayBalance}
        </motion.button>

        {/* Screen reader announcements */}
        <div id="amount-balance" className="sr-only">
          Current {balanceLabel.toLowerCase()}: {displayBalance}
        </div>
      </div>
    );
  }
);

AmountInput.displayName = "AmountInput";

// =============================================================================
// VALIDATION MESSAGES COMPONENT (was in Controls/ValidationMessages.tsx)
// =============================================================================

interface ValidationMessagesProps {
  validation: SwapValidation;
}

export const ValidationMessages = memo<ValidationMessagesProps>(
  ({ validation }) => {
    if (validation.isValid && validation.warnings.length === 0) {
      return null;
    }

    return (
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
    );
  }
);

ValidationMessages.displayName = "ValidationMessages";

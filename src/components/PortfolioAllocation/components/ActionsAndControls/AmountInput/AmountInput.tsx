"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { GRADIENTS } from "@/constants/design-system";
import { formatCurrency, formatTokenAmount } from "@/lib/formatters";
import type { SwapToken } from "@/types/swap";

import type { OperationMode } from "../../../types";
import { constrainValue, formatCryptoAmount, parseInputValue } from "./utils";

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
      if (operationMode === "zapIn" && fromToken?.balance !== undefined) {
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

        // Allow partial decimal input (e.g., "0.", "10.", ".5")
        // Fixed regex to prevent catastrophic backtracking
        if (/^(\d+\.?\d*|\.\d+)$/.test(rawValue)) {
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
    const tokenPrice =
      typeof fromToken?.price === "number" ? fromToken.price : undefined;
    const usdValue =
      tokenPrice !== undefined
        ? parseInputValue(inputValue) * tokenPrice
        : undefined;

    // Display label and balance based on operation mode
    const balanceLabel =
      operationMode === "zapOut" ? "Portfolio Value" : "Balance";
    const displayBalance =
      operationMode === "zapOut"
        ? formatCurrency(totalPortfolioValue)
        : fromToken?.balance !== undefined
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
                  : `bg-gradient-to-br ${GRADIENTS.PRIMARY_SUBTLE} text-white hover:${GRADIENTS.PRIMARY_SUBTLE_HOVER}`
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
                  : `bg-gradient-to-br ${GRADIENTS.PRIMARY_SUBTLE} text-white hover:${GRADIENTS.PRIMARY_SUBTLE_HOVER}`
              }
            `}
            aria-label="Increase amount"
            aria-disabled={disabled || isAtMax}
          >
            <ChevronUp className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="text-center text-xs text-gray-400 space-y-1">
          {tokenPrice !== undefined ? (
            <>
              <div>Price: {`${formatCurrency(tokenPrice)}/token`}</div>
              <div>≈ {`${formatCurrency(usdValue ?? 0)} USD`}</div>
            </>
          ) : (
            <div>Price unavailable</div>
          )}
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
                : `bg-gradient-to-r ${GRADIENTS.PRIMARY_FAINT} text-purple-300 hover:${GRADIENTS.PRIMARY_FAINT_HOVER}`
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

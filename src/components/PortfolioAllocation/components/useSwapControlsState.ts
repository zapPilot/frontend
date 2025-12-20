"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { SwapToken } from "@/types/ui/swap";

import type {
  OperationMode,
  ProcessedAssetCategory,
  SwapSettings,
  SwapValidation,
} from "../types";

const buildSwapValidation = (
  operationMode: OperationMode,
  swapSettings: SwapSettings,
  validationAttempted: boolean,
  validationMode: "onSubmit" | "onChange"
): SwapValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Progressive validation: show errors based on validation mode
  const shouldShowErrors = validationAttempted || validationMode === "onChange";

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
};

interface SwapControlsState {
  validation: SwapValidation;
  attemptValidation: () => void;
  resetValidation: () => void;
  handleTokenChange: (field: "fromToken" | "toToken", token: SwapToken) => void;
  handleAmountChange: (amount: string) => void;
  handleSlippageChange: (slippageTolerance: number) => void;
  handleOptimizationChange: (
    option: "dustZap" | "rebalance",
    checked: boolean
  ) => void;
  totalPortfolioValue: number;
}

interface SwapControlsStateConfig {
  operationMode: OperationMode;
  swapSettings: SwapSettings;
  onSwapSettingsChange: (settings: SwapSettings) => void;
  includedCategories: ProcessedAssetCategory[];
}

export function useSwapControlsState({
  operationMode,
  swapSettings,
  onSwapSettingsChange,
  includedCategories,
}: SwapControlsStateConfig): SwapControlsState {
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [validationMode, setValidationMode] = useState<"onSubmit" | "onChange">(
    "onSubmit"
  );

  const attemptValidation = useCallback(() => {
    setValidationAttempted(true);
    setValidationMode("onChange"); // Switch to real-time validation after first attempt
  }, []);

  const resetValidation = useCallback(() => {
    setValidationAttempted(false);
    setValidationMode("onSubmit");
  }, []);

  const resetValidationOnChange = useCallback(() => {
    if (validationAttempted && validationMode === "onChange") {
      // In onChange mode, reset validation when user makes corrections
      setValidationAttempted(false);
    }
  }, [validationAttempted, validationMode]);

  const prevSwapSettingsRef = useRef(swapSettings);
  if (prevSwapSettingsRef.current !== swapSettings) {
    resetValidationOnChange();
    prevSwapSettingsRef.current = swapSettings;
  }

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
      const currentOptions =
        swapSettings.optimizationOptions ??
        ({
          dustZap: false,
          rebalance: false,
        } as const);

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

  const totalPortfolioValue = useMemo(() => {
    return includedCategories.reduce((sum, cat) => sum + cat.totalValue, 0);
  }, [includedCategories]);

  const validation = useMemo(
    () =>
      buildSwapValidation(
        operationMode,
        swapSettings,
        validationAttempted,
        validationMode
      ),
    [operationMode, swapSettings, validationAttempted, validationMode]
  );

  return {
    validation,
    attemptValidation,
    resetValidation,
    handleTokenChange,
    handleAmountChange,
    handleSlippageChange,
    handleOptimizationChange,
    totalPortfolioValue,
  };
}

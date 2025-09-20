"use client";

import { TokenImage } from "@/components/shared/TokenImage";
import { GradientButton } from "@/components/ui";
import { GRADIENTS, Z_INDEX } from "@/constants/design-system";
import { useDropdown } from "@/hooks";
import { useZapTokensWithStates } from "@/hooks/queries/useZapTokensQuery";
import type { SwapToken } from "@/types/swap";
import { motion } from "framer-motion";
import { AlertCircle, ChevronDown, RefreshCw } from "lucide-react";
import { memo } from "react";
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
}

export const TokenSelector = memo<TokenSelectorProps>(
  ({ selectedToken, onTokenSelect, label, placeholder, chainId }) => {
    const dropdown = useDropdown(false);
    const {
      tokens,
      hasTokens,
      isEmpty,
      isInitialLoading,
      isError,
      error,
      refetch,
      isRefetching,
    } = useZapTokensWithStates(chainId);

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
                          {token.balance.toFixed(
                            token.symbol.includes("BTC") ||
                              token.symbol.includes("ETH")
                              ? 4
                              : 2
                          )}
                        </div>
                        {token.price && (
                          <div className="text-xs text-gray-500">
                            ${(token.balance * token.price).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
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

interface AmountInputProps {
  operationMode: OperationMode;
  amount: string;
  onAmountChange: (amount: string) => void;
  fromToken?: SwapToken;
  totalPortfolioValue: number;
  className?: string;
}

export const AmountInput = memo<AmountInputProps>(
  ({
    operationMode,
    amount,
    onAmountChange,
    fromToken,
    totalPortfolioValue,
    className = "",
  }) => {
    // Dynamic label based on operation mode
    const getLabel = () => {
      switch (operationMode) {
        case "zapIn":
          return "Amount to Zap In";
        case "zapOut":
          return "Portfolio Value to Convert";
        case "rebalance":
          return "Amount to Rebalance";
        default:
          return "Amount";
      }
    };

    // Currency symbol display
    const getCurrencySymbol = () => {
      if (operationMode === "zapIn" && fromToken) {
        return fromToken.symbol;
      }
      return "USD";
    };

    // Handle max button click
    const handleMaxClick = () => {
      if (
        operationMode === "zapIn" &&
        fromToken &&
        fromToken.balance !== undefined
      ) {
        onAmountChange(fromToken.balance.toString());
      } else if (operationMode === "zapOut" || operationMode === "rebalance") {
        onAmountChange(totalPortfolioValue.toString());
      }
    };

    // Show balance info for zapIn mode
    const showBalance = operationMode === "zapIn" && fromToken;

    // Show portfolio info for zapOut/rebalance modes
    const showPortfolioValue =
      operationMode === "zapOut" || operationMode === "rebalance";

    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-xs font-medium text-gray-400">
          {getLabel()}
        </label>

        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={e => onAmountChange(e.target.value)}
            placeholder="0.0"
            min="0"
            step="0.01"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-lg placeholder-gray-500 focus:outline-none focus:border-purple-500"
            data-testid="amount-input"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
            {getCurrencySymbol()}
          </div>
        </div>

        {/* Balance/Portfolio Info */}
        <div className="flex justify-between text-xs text-gray-400">
          {showBalance && fromToken!.balance !== undefined && (
            <span>
              Balance: {fromToken!.balance.toFixed(4)} {fromToken!.symbol}
            </span>
          )}

          {showPortfolioValue && (
            <span>
              Portfolio Value: ${totalPortfolioValue.toLocaleString()}
            </span>
          )}

          <button
            onClick={handleMaxClick}
            className="text-purple-400 hover:text-purple-300 transition-colors"
            disabled={
              operationMode === "zapIn" &&
              (!fromToken || fromToken.balance === undefined)
            }
          >
            Max
          </button>
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

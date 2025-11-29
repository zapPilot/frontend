"use client";

import { AlertCircle, ChevronDown, RefreshCw } from "lucide-react";
import { memo, useMemo } from "react";

import { TokenListSkeleton } from "@/components/ui";
import { AnimatedDropdown } from "@/components/ui/AnimatedDropdown";
import { Z_INDEX } from "@/constants/design-system";
import { useDropdown } from "@/hooks";
import {
  useZapTokensWithStates,
  type UseZapTokensWithStatesOptions,
} from "@/hooks/queries/useZapTokensQuery";
import type { SwapToken } from "@/types/ui/swap";
import { logger } from "@/utils/logger";

import { TokenSummary } from "./TokenSummary";

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
        priceEnabled: true,
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
          className="w-full flex items-center justify-between gap-3 p-3 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          data-testid={`token-selector-${label.toLowerCase().replace(" ", "-")}`}
        >
          {selectedToken ? (
            <TokenSummary token={selectedToken} className="flex-1 min-w-0" />
          ) : (
            <span className="flex-1 text-left text-gray-400">
              {placeholder}
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        {dropdown.isOpen && (
          <>
            <AnimatedDropdown
              className={`absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl ${Z_INDEX.TOAST} max-h-64 overflow-auto`}
            >
              {/* Loading State - Compact Skeleton */}
              {isInitialLoading && <TokenListSkeleton count={5} />}

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
                    onClick={() => {
                      void (async () => {
                        try {
                          await refetch();
                        } catch (refetchError) {
                          logger.error(
                            "Failed to refetch tokens after load failure",
                            refetchError
                          );
                        }
                      })();
                    }}
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

              {/* Token List - COMPACT 2-LINE DESIGN */}
              {hasTokens &&
                tokens.map(token => (
                  <button
                    key={`${token.chainId}-${token.address}`}
                    onClick={() => {
                      onTokenSelect(token);
                      dropdown.close();
                    }}
                    className="w-full py-2.5 px-3 hover:bg-gray-800/70 transition-colors text-left"
                    data-testid={`token-option-${token.symbol}`}
                  >
                    <TokenSummary token={token} className="w-full" />
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
            </AnimatedDropdown>
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

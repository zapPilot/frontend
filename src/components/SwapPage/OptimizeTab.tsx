"use client";
import { useCallback, useEffect, useState } from "react";
import {
  useActiveAccount,
  useActiveWalletChain,
  useSendAndConfirmCalls,
} from "thirdweb/react";
import { useDustZapStream } from "../../hooks/useDustZapStream";
import { useToast } from "../../hooks/useToast";
import { formatSmallNumber } from "../../utils/formatters";
import { getTokenSymbol } from "../../utils/tokenUtils";
import { TokenImage } from "../shared/TokenImage";
import { GRADIENTS } from "@/constants/design-system";
import { GlassCard, GradientButton } from "../ui";
import { useTokenState } from "./hooks/useTokenState";
import { useWalletTransactions } from "./hooks/useWalletTransactions";
import { useOptimizationData } from "./hooks/useOptimizationData";
import { useUIState } from "./hooks/useUIState";
import { OptimizationSelector } from "./OptimizationSelector";
import { SlippageSelector } from "./SlippageSelector";
import { StreamingProgress } from "./StreamingProgress";
export interface OptimizationOptions {
  convertDust: boolean;
  rebalancePortfolio: boolean;
  slippage: number;
}

interface DustToken {
  id: string;
  symbol: string;
  optimized_symbol?: string;
  amount: number;
  price: number;
  decimals: number;
  logo_url?: string;
  raw_amount_hex_str?: string;
}

interface TokenGridProps {
  tokens: DustToken[];
  showDetails: boolean;
  onToggleDetails: () => void;
  onDeleteToken: (tokenId: string) => void;
  deletedTokenIds: Set<string>;
  onRestoreDeletedTokens: () => void;
}

const TokenGrid = ({
  tokens,
  showDetails,
  onToggleDetails,
  onDeleteToken,
  deletedTokenIds,
  onRestoreDeletedTokens,
}: TokenGridProps) => {
  const filteredAndSortedTokens = tokens;

  if (!filteredAndSortedTokens.length) return null;

  const displayTokens = showDetails
    ? filteredAndSortedTokens
    : filteredAndSortedTokens.slice(0, 6);

  return (
    <GlassCard>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold gradient-text">Token Details</h3>
          <div className="flex gap-2">
            {deletedTokenIds.size > 0 && (
              <button
                onClick={onRestoreDeletedTokens}
                className="text-sm text-green-400 hover:text-green-300 transition-colors cursor-pointer"
              >
                Restore {deletedTokenIds.size} Deleted
              </button>
            )}
            <button
              onClick={onToggleDetails}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              {showDetails
                ? "Show Less"
                : `Show All ${filteredAndSortedTokens.length}`}
            </button>
          </div>
        </div>

        {/* Token Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTokens.map(token => {
            const totalValue = token.amount * token.price;
            const symbol = getTokenSymbol(token);

            return (
              <div
                key={token.id}
                className="relative bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
              >
                <button
                  onClick={() => onDeleteToken(token.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors duration-200 cursor-pointer"
                  title="Remove this token from conversion"
                >
                  ×
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <TokenImage
                    token={token}
                    size={32}
                    className="w-8 h-8 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {symbol}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatSmallNumber(token.amount)} tokens
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Value:</span>
                    <span className="text-sm font-semibold text-green-400">
                      ${formatSmallNumber(totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Price:</span>
                    <span className="text-sm text-gray-300">
                      ${formatSmallNumber(token.price)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more indicator */}
        {!showDetails && filteredAndSortedTokens.length > 6 && (
          <div className="text-center">
            <span className="text-gray-400">
              And {filteredAndSortedTokens.length - 6} more tokens...
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export function OptimizeTab() {
  // ThirdWeb hooks for wallet connection
  const activeAccount = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const { mutate: sendCalls } = useSendAndConfirmCalls();

  // Toast notifications
  const { showToast } = useToast();

  // Helper function to build explorer URL
  const getExplorerUrl = useCallback(
    (txnHash: string) => {
      const baseUrl = activeChain?.blockExplorers?.[0]?.url;
      return baseUrl ? `${baseUrl}/tx/${txnHash}` : null;
    },
    [activeChain]
  );

  // Computed wallet values
  const userAddress = activeAccount?.address;
  const chainId = activeChain?.id;
  const chainName = activeChain?.name;
  const isWalletConnected = !!activeAccount;

  // State for optimization options
  const [optimizationOptions, setOptimizationOptions] =
    useState<OptimizationOptions>({
      convertDust: true, // Default: both selected
      rebalancePortfolio: true,
      slippage: 30,
    });

  // State for workflow
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Token state management
  const {
    tokens: dustTokens,
    filteredTokens: filteredDustTokens,
    isLoading: loadingTokens,
    error: tokensError,
    deletedIds: deletedTokenIds,
    fetchTokens: fetchDustTokens,
    deleteToken: handleDeleteToken,
    restoreTokens: handleRestoreDeletedTokens,
  } = useTokenState(showToast as any);

  // UI state management
  const {
    showDetails,
    showTechnicalDetails,
    toggleDetails: handleToggleDetails,
    toggleTechnicalDetails: handleToggleTechnicalDetails,
  } = useUIState();

  // Wallet transaction state management
  const {
    error: walletError,
    batchProgress,
    currentBatch: currentBatchIndex,
    isSending: sendingToWallet,
    isSuccess: walletSuccess,
    setTransactions: setAccumulatedTransactions,
    autoSendWhenReady,
    reset: resetWalletState,
  } = useWalletTransactions({
    sendCalls,
    activeAccount,
    activeChain,
    showToast: showToast as any,
    getExplorerUrl,
  });

  // SSE streaming hook
  const {
    isStreaming,
    isComplete,
    error: streamError,
    events,
    totalTokens,
    processedTokens,
    batchesCompleted,
    progress,
    startStreaming,
    stopStreaming,
    clearEvents,
  } = useDustZapStream();

  // Optimization data calculations
  const optimizationData = useOptimizationData({
    filteredTokens: filteredDustTokens,
    optimizationOptions,
    isWalletConnected,
    isLoading: loadingTokens,
  });

  // Function to create DustZap intent
  const createDustZapIntent = useCallback(
    async (
      userAddress: string,
      chainId: number,
      filteredDustTokens: DustToken[],
      slippage: number
    ) => {
      try {
        const response = await fetch(
          `${process.env["NEXT_PUBLIC_INTENT_ENGINE_URL"]}/api/v1/intents/dustZap`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userAddress,
              chainId,
              params: {
                slippage,
                dustTokens: filteredDustTokens.map(token => ({
                  address: token.id,
                  symbol: token.optimized_symbol || token.symbol,
                  amount: token.amount,
                  price: token.price,
                  decimals: token.decimals,
                  raw_amount_hex_str: token.raw_amount_hex_str,
                })),
                toTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                toTokenDecimals: 18,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to create DustZap intent: ${response.statusText}`
          );
        }

        const result = await response.json();
        return result.intentId;
      } catch (error) {
        // Show user-friendly error notification
        showToast({
          type: "error",
          title: "Optimization Failed",
          message:
            "Unable to prepare optimization. Please check connection and retry.",
          duration: 8000,
        });
        throw error;
      }
    },
    [showToast] // Add showToast as dependency
  );

  const handleOptimize = useCallback(async () => {
    if (
      !optimizationOptions.convertDust &&
      !optimizationOptions.rebalancePortfolio
    ) {
      return;
    }

    setIsOptimizing(true);
    clearEvents();

    // Reset wallet transaction states
    resetWalletState();

    try {
      // If dust conversion is enabled, integrate with dustzap streaming
      if (optimizationOptions.convertDust && filteredDustTokens.length > 0) {
        // Validate wallet connection
        if (!userAddress || !chainId) {
          throw new Error(
            "Wallet must be connected to perform dust conversion"
          );
        }

        // Safeguard: Ensure no deleted tokens are included
        const hasDeletedTokens = filteredDustTokens.some(token =>
          deletedTokenIds.has(token.id)
        );
        if (hasDeletedTokens) {
          // Show critical error notification
          showToast({
            type: "error",
            title: "Internal Error Detected",
            message:
              "Data consistency issue detected. Please refresh and try again.",
            duration: 10000,
          });
          throw new Error("Deleted tokens found in filtered list");
        }

        const newIntentId = await createDustZapIntent(
          userAddress,
          chainId,
          filteredDustTokens,
          optimizationOptions.slippage
        );

        // Start streaming
        await startStreaming(newIntentId);
      } else {
        // Fallback to mock optimization for portfolio rebalancing only
        setTimeout(() => {
          setIsOptimizing(false);
        }, 12000);
      }
    } catch (error) {
      // Show general optimization error notification
      showToast({
        type: "error",
        title: "Optimization Failed",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during optimization.",
        duration: 8000,
      });
      setIsOptimizing(false);
    }
  }, [
    optimizationOptions,
    filteredDustTokens,
    createDustZapIntent,
    startStreaming,
    clearEvents,
    userAddress,
    chainId,
    showToast,
    deletedTokenIds,
    resetWalletState,
  ]);

  const getOptimizeButtonText = useCallback(() => {
    const { convertDust, rebalancePortfolio } = optimizationOptions;

    // Show wallet connection requirement
    if (!isWalletConnected) {
      return "Connect Wallet to Optimize";
    }

    // Show wallet transaction states
    if (sendingToWallet) {
      return "Confirming in Wallet...";
    }

    if (walletSuccess) {
      return "✓ Optimization Complete";
    }

    // Show streaming-specific states
    if (isStreaming) {
      if (totalTokens > 0) {
        return `Converting... (${processedTokens}/${totalTokens})`;
      }
      return "Converting...";
    }

    if (isOptimizing) {
      return "Optimizing...";
    }

    if (convertDust && rebalancePortfolio) {
      return "Optimize Portfolio (Convert + Rebalance)";
    } else if (convertDust) {
      return "Convert Dust to ETH";
    } else if (rebalancePortfolio) {
      return "Rebalance Portfolio";
    }
    return "Select Optimization";
  }, [
    optimizationOptions,
    isStreaming,
    isOptimizing,
    totalTokens,
    processedTokens,
    isWalletConnected,
    sendingToWallet,
    walletSuccess,
  ]);

  // Simplified effect - fetch tokens once per wallet/chain combination
  useEffect(() => {
    // Only proceed if we have wallet connection data
    if (!userAddress || !chainName) {
      return;
    }

    // Fetch tokens regardless of toggle state - toggle only controls UI visibility
    // The hook handles request deduplication and state management internally
    fetchDustTokens(chainName, userAddress);
  }, [userAddress, chainName, fetchDustTokens]); // Only wallet/chain changes trigger fetching

  // Effect to collect transactions only from complete event
  useEffect(() => {
    // Only use the authoritative complete event for wallet transactions
    const completeEvent = events.find(
      (event: any) => event.type === "complete"
    ) as any;

    if (completeEvent && completeEvent.transactions) {
      setAccumulatedTransactions(completeEvent.transactions);
    } else if (completeEvent) {
      showToast({
        type: "error",
        title: "No Transactions Generated",
        message:
          "Optimization completed but no transactions were needed. Tokens may already be optimized or lack valid conversion paths.",
        duration: 8000,
      });
    }
  }, [events, setAccumulatedTransactions, showToast]);
  // Effect to send transactions to wallet when stream completes
  useEffect(() => {
    autoSendWhenReady(isComplete);
  }, [isComplete, autoSendWhenReady]);

  // Effect to handle stream completion (updated)
  useEffect(() => {
    if (isComplete) {
      setIsOptimizing(false);
      stopStreaming();
    }
  }, [isComplete, stopStreaming]);

  const renderCardsVariation = () => (
    <div className="space-y-6" data-testid="optimize-tab-cards">
      <div className="text-center">
        <h3 className="text-2xl font-bold gradient-text mb-2">
          Portfolio Optimization
        </h3>
        <p className="text-gray-400">
          Choose optimization methods for your portfolio
        </p>
      </div>

      {/* Optimization Selector */}
      <GlassCard>
        <OptimizationSelector
          options={optimizationOptions}
          onChange={setOptimizationOptions}
          dustTokens={dustTokens}
          loadingTokens={loadingTokens}
          mockData={{
            rebalanceActions: optimizationData.rebalanceActions,
            chainCount: optimizationData.chainCount,
          }}
        />
      </GlassCard>

      {/* Streaming Progress */}
      <StreamingProgress
        isStreaming={isStreaming}
        events={events}
        totalTokens={totalTokens}
        processedTokens={processedTokens}
        progress={progress}
        batchesCompleted={batchesCompleted}
        streamError={streamError}
        tokensError={tokensError}
        walletError={walletError}
        sendingToWallet={sendingToWallet}
        walletSuccess={walletSuccess}
        batchProgress={batchProgress}
        currentBatchIndex={currentBatchIndex}
        activeAccount={activeAccount}
        showTechnicalDetails={showTechnicalDetails}
        onToggleTechnicalDetails={handleToggleTechnicalDetails}
      />
      {/* Token Grid */}
      {optimizationOptions.convertDust && dustTokens.length > 0 && (
        <TokenGrid
          tokens={filteredDustTokens}
          showDetails={showDetails}
          onToggleDetails={handleToggleDetails}
          onDeleteToken={handleDeleteToken}
          deletedTokenIds={deletedTokenIds}
          onRestoreDeletedTokens={handleRestoreDeletedTokens}
        />
      )}

      {/* Slippage and Execute */}
      <GlassCard>
        <div className="space-y-4">
          <SlippageSelector
            slippage={optimizationOptions.slippage}
            onChange={slippage =>
              setOptimizationOptions(prev => ({ ...prev, slippage }))
            }
          />

          {!isWalletConnected && (
            <div className="text-center text-sm text-amber-400 bg-amber-900/20 rounded-lg p-3">
              Please connect your wallet to enable portfolio optimization
            </div>
          )}

          <GradientButton
            disabled={
              optimizationData.selectedCount === 0 ||
              isOptimizing ||
              isStreaming ||
              sendingToWallet ||
              loadingTokens ||
              !isWalletConnected
            }
            gradient={GRADIENTS.PRIMARY}
            className="w-full py-4"
            onClick={handleOptimize}
          >
            {getOptimizeButtonText()}
          </GradientButton>
        </div>
      </GlassCard>
    </div>
  );

  return renderCardsVariation();
}

"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useActiveAccount,
  useActiveWalletChain,
  useSendAndConfirmCalls,
} from "thirdweb/react";
import { useCancellableOperation } from "../../hooks/useCancellableOperation";
import { useDustZapStream } from "../../hooks/useDustZapStream";
import { transformToDebankChainName } from "../../utils/chainHelper";
import { getTokens } from "../../utils/dustConversion";
import { formatSmallNumber } from "../../utils/formatters";
import { getTokenSymbol } from "../../utils/tokenUtils";
import {
  createTransactionBatches,
  getSimpleWalletName,
  getWalletBatchConfig,
} from "../../utils/walletBatching";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { TokenImage } from "../shared/TokenImage";
import { GlassCard, GradientButton } from "../ui";
import { OptimizationSelector } from "./OptimizationSelector";
import { SlippageSelector } from "./SlippageSelector";
import { WalletTransactionProgress } from "./WalletTransactionProgress";
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

  // State for dust tokens
  const [dustTokens, setDustTokens] = useState<DustToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);

  // State for TokenGrid functionality
  const [showDetails, setShowDetails] = useState(false);
  const [deletedTokenIds, setDeletedTokenIds] = useState(new Set<string>());

  // State for DustZap Progress technical details
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // State for wallet transaction sending
  const [accumulatedTransactions, setAccumulatedTransactions] = useState<any[]>(
    []
  );
  const [sendingToWallet, setSendingToWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletSuccess, setWalletSuccess] = useState(false);

  // Simple wallet batching (replaces complex useWalletCapabilities)
  const {
    startOperation,
    cancelOperation,
    updateProgress,
    completeOperation,
    errorOperation,
    operationStatus,
  } = useCancellableOperation();

  // Enhanced wallet transaction state
  const [batchProgress, setBatchProgress] = useState<any[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [totalEstimatedTime, setTotalEstimatedTime] = useState<number | null>(
    null
  );
  const [elapsedTime, setElapsedTime] = useState(0);

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

  // Debug: Initial state logging
  useEffect(() => {
    console.log("🔧 Initial State Check:", {
      sendingToWallet,
      walletSuccess,
      walletError,
      isOptimizing,
      isStreaming,
      isComplete,
      accumulatedTransactionsLength: accumulatedTransactions.length,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Calculate dust token data (filtered by deleted tokens)
  const filteredDustTokens = useMemo(() => {
    return dustTokens.filter(token => !deletedTokenIds.has(token.id));
  }, [dustTokens, deletedTokenIds]);

  const dustTokenData = useMemo(() => {
    if (!filteredDustTokens.length) return { dustValue: 0, dustTokenCount: 0 };

    const dustValue = filteredDustTokens.reduce(
      (sum, token) => sum + token.amount * token.price,
      0
    );
    return {
      dustValue,
      dustTokenCount: filteredDustTokens.length,
    };
  }, [filteredDustTokens]);

  // Mock data - in real app this would come from API/hooks
  const mockOptimizationData = useMemo(
    () => ({
      dustValue: dustTokenData.dustValue,
      dustTokenCount: dustTokenData.dustTokenCount,
      rebalanceActions: 3,
      chainCount: 2,
      totalSavings: 15.2,
      estimatedGasSavings: 0.003,
    }),
    [dustTokenData]
  );

  // Function to fetch dust tokens
  const fetchDustTokens = useCallback(
    async (chainName: string, accountAddress: string) => {
      if (!chainName || !accountAddress) return;

      setLoadingTokens(true);
      setTokensError(null);

      try {
        const debankChainName = transformToDebankChainName(
          chainName.toLowerCase()
        );
        const tokens = await getTokens(debankChainName, accountAddress);
        setDustTokens(tokens);
      } catch (error) {
        console.error("Error fetching dust tokens:", error);
        setTokensError(
          error instanceof Error ? error.message : "Unknown error"
        );
        setDustTokens([]);
      } finally {
        setLoadingTokens(false);
      }
    },
    []
  );

  // Function to create DustZap intent
  const createDustZapIntent = useCallback(
    async (
      userAddress: string,
      chainId: number,
      filteredDustTokens: DustToken[],
      slippage: number
    ) => {
      try {
        console.log("🔍 Creating DustZap intent with filtered tokens:", {
          totalTokens: filteredDustTokens.length,
          tokenIds: filteredDustTokens.map(t => t.id),
          tokenSymbols: filteredDustTokens.map(t => t.symbol),
        });
        console.log("filteredDustTokens", filteredDustTokens);
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
        console.error("Error creating DustZap intent:", error);
        throw error;
      }
    },
    [] // Empty dependency array - function doesn't close over external variables
  );

  // TokenGrid handler functions
  const handleDeleteToken = useCallback((tokenId: string) => {
    setDeletedTokenIds(prev => new Set([...prev, tokenId]));
  }, []);

  const handleRestoreDeletedTokens = useCallback(() => {
    setDeletedTokenIds(new Set());
  }, []);

  const handleToggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

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
    setAccumulatedTransactions([]);
    setSendingToWallet(false);
    setWalletError(null);
    setWalletSuccess(false);

    try {
      // If dust conversion is enabled, integrate with dustzap streaming
      if (optimizationOptions.convertDust && filteredDustTokens.length > 0) {
        // Validate wallet connection
        if (!userAddress || !chainId) {
          throw new Error(
            "Wallet must be connected to perform dust conversion"
          );
        }

        // Create DustZap intent
        console.log("🚮 Token filtering status before intent creation:", {
          totalDustTokens: dustTokens.length,
          deletedTokenIds: Array.from(deletedTokenIds),
          filteredDustTokens: filteredDustTokens.length,
          filteredTokenIds: filteredDustTokens.map(t => t.id),
          filteredTokenSymbols: filteredDustTokens.map(t => t.symbol),
        });

        // Safeguard: Ensure no deleted tokens are included
        const hasDeletedTokens = filteredDustTokens.some(token =>
          deletedTokenIds.has(token.id)
        );
        if (hasDeletedTokens) {
          console.error(
            "❌ Deleted tokens found in filtered list! This should not happen."
          );
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
      console.error("Error during optimization:", error);
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

  const selectedCount = useMemo(() => {
    return (
      (optimizationOptions.convertDust ? 1 : 0) +
      (optimizationOptions.rebalancePortfolio ? 1 : 0)
    );
  }, [optimizationOptions]);

  // Effect to fetch dust tokens when needed
  useEffect(() => {
    // Only fetch if wallet is connected and we have the required data
    if (
      optimizationOptions.convertDust &&
      !dustTokens.length &&
      !loadingTokens &&
      userAddress &&
      chainName
    ) {
      fetchDustTokens(chainName, userAddress);
    }
  }, [
    optimizationOptions.convertDust,
    dustTokens.length,
    loadingTokens,
    userAddress,
    chainName,
    fetchDustTokens,
  ]);

  // Effect to refresh data when wallet address or chain changes
  useEffect(() => {
    if (userAddress && chainName && optimizationOptions.convertDust) {
      // Clear existing data and fetch new data for the new wallet/chain
      setDustTokens([]);
      setDeletedTokenIds(new Set());
      setTokensError(null);
      fetchDustTokens(chainName, userAddress);
    }
  }, [
    userAddress,
    chainName,
    optimizationOptions.convertDust,
    fetchDustTokens,
  ]);

  // Effect to collect transactions only from complete event
  useEffect(() => {
    // Only use the authoritative complete event for wallet transactions
    const completeEvent = events.find(
      (event: any) => event.type === "complete"
    );

    if (completeEvent && completeEvent.transactions) {
      setAccumulatedTransactions(completeEvent.transactions);
    } else if (completeEvent) {
      console.log(
        "❌ Complete event found but no transactions:",
        completeEvent
      );
    }
  }, [events]);
  // Enhanced function to send accumulated transactions to wallet with all new features
  const handleSendToWallet = useCallback(
    async (skipPreview = false) => {
      console.log("handleSendToWallet");
      if (accumulatedTransactions.length === 0) {
        console.warn("No transactions to send to wallet");
        return;
      }

      try {
        // Step 1: Show transaction preview for large batches (unless skipped)
        if (!skipPreview && accumulatedTransactions.length > 10) {
          setShowTransactionPreview(true);
          return; // Wait for user confirmation via modal
        }

        // Step 2: Initialize operation tracking
        const operationToken = startOperation(
          "wallet_transaction",
          accumulatedTransactions.length,
          300000 // 5 minute timeout
        );

        // Step 3: Get wallet batch configuration (simple dictionary lookup)
        const batchConfig = getWalletBatchConfig(activeAccount);
        const walletName = getSimpleWalletName(activeAccount);

        console.log(
          `Using ${walletName} with batch size ${batchConfig.batchSize}`
        );

        // Step 4: Create transaction batches with optimal size
        const transactionBatches = createTransactionBatches(
          accumulatedTransactions,
          batchConfig.batchSize
        );

        // Step 5: Calculate timing estimates
        const estimatedTimePerBatch = batchConfig.estimatedTime;
        const totalEstimatedMs =
          transactionBatches.length * estimatedTimePerBatch;
        setTotalEstimatedTime(totalEstimatedMs / 1000);

        // Step 6: Initialize batch progress tracking
        const initialBatchProgress = transactionBatches.map((batch, index) => ({
          batchIndex: index,
          totalBatches: transactionBatches.length,
          transactionCount: batch.length,
          status: "pending" as const,
          estimatedTime: estimatedTimePerBatch / 1000,
          transactions: batch,
        }));
        setBatchProgress(initialBatchProgress);

        // Step 7: Start timing and progress tracking
        const operationStartTime = Date.now();
        setSendingToWallet(true);
        setWalletError(null);
        setWalletSuccess(false);

        // Step 8: Timer for elapsed time updates
        const timerInterval = setInterval(() => {
          if (operationStartTime) {
            setElapsedTime((Date.now() - operationStartTime) / 1000);
          }
        }, 1000);

        let completedTransactionCount = 0;

        try {
          // Step 9: Process each batch sequentially with enhanced error handling
          for (
            let batchIndex = 0;
            batchIndex < transactionBatches.length;
            batchIndex++
          ) {
            // Check for cancellation
            operationToken.throwIfCancelled();
            const batch = transactionBatches[batchIndex];
            console.log(
              "batch",
              batch,
              "transactionBatches",
              transactionBatches
            );
            const batchStartTime = Date.now();

            // Update current batch index and status
            setCurrentBatchIndex(batchIndex);
            setBatchProgress(prev =>
              prev.map((bp, i) =>
                i === batchIndex ? { ...bp, status: "processing" } : bp
              )
            );

            // Update operation progress
            updateProgress(
              completedTransactionCount,
              accumulatedTransactions.length
            );

            try {
              // Convert batch to ThirdWeb calls format
              const calls = batch.map(tx => ({
                to: tx.to,
                ...(tx.data != null && { data: tx.data }),
                value: tx.value ? BigInt(tx.value) : 0, // Convert string to bigint for proper ETH value handling
                gasLimit: BigInt(tx.gasLimit),
              }));
              console.log("calls", calls);

              console.log(
                `Sending batch ${batchIndex + 1}/${transactionBatches.length} (${calls.length} transactions) to ${walletName}...`
              );

              // Send batch to wallet
              await new Promise<void>((resolve, reject) => {
                sendCalls(
                  { calls, atomicRequired: false },
                  // { calls: calls, atomicRequired: false },
                  {
                    onSuccess: result => {
                      console.log(
                        `Batch ${batchIndex + 1} successful:`,
                        result
                      );
                      resolve();
                    },
                    onError: error => {
                      console.error(`Batch ${batchIndex + 1} failed:`, error);
                      reject(error);
                    },
                  }
                );
              });

              // Mark batch as completed
              const batchEndTime = Date.now();
              const actualBatchTime = (batchEndTime - batchStartTime) / 1000;

              setBatchProgress(prev =>
                prev.map((bp, i) =>
                  i === batchIndex
                    ? {
                        ...bp,
                        status: "completed",
                        actualTime: actualBatchTime,
                      }
                    : bp
                )
              );

              completedTransactionCount += batch.length;
              updateProgress(
                completedTransactionCount,
                accumulatedTransactions.length
              );

              // Add delay between batches to prevent overwhelming the wallet
              if (batchIndex < transactionBatches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (batchError) {
              // Handle batch-specific errors
              console.error(`Batch ${batchIndex + 1} failed:`, batchError);

              setBatchProgress(prev =>
                prev.map((bp, i) =>
                  i === batchIndex
                    ? {
                        ...bp,
                        status: "failed",
                        error: batchError.message || "Unknown error",
                      }
                    : bp
                )
              );

              console.error(`Batch ${batchIndex + 1} error:`, batchError);

              // For now, continue with next batch (could be made configurable)
              console.warn(
                `Continuing with next batch after error in batch ${batchIndex + 1}`
              );
            }
          }

          // Step 10: Check final results
          const failedBatches = initialBatchProgress.filter(
            bp => bp.status === "failed"
          ).length;
          const successfulBatches = initialBatchProgress.filter(
            bp => bp.status === "completed"
          ).length;

          if (successfulBatches > 0) {
            setWalletSuccess(true);
            completeOperation({
              totalBatches: transactionBatches.length,
              successfulBatches,
              failedBatches,
              totalTransactions: accumulatedTransactions.length,
              completedTransactions: completedTransactionCount,
            });

            console.log(
              `✅ Wallet operation completed: ${successfulBatches}/${transactionBatches.length} batches successful`
            );
          } else {
            throw new Error("All transaction batches failed");
          }
        } catch (operationError) {
          console.error("Wallet operation failed:", operationError);
          setWalletError(operationError.message || "Unknown error");
          errorOperation(operationError);

          console.error("Wallet operation failed:", operationError);
        } finally {
          clearInterval(timerInterval);
          setSendingToWallet(false);
        }
      } catch (error) {
        console.error("Error in enhanced wallet operation:", error);
        setWalletError(
          error instanceof Error ? error.message : "Unknown error"
        );
        setSendingToWallet(false);

        console.error("Wallet setup error:", error);
      }
    },
    [
      accumulatedTransactions,
      sendCalls,
      activeAccount,
      startOperation,
      updateProgress,
      completeOperation,
      errorOperation,
    ]
  );
  // Effect to send transactions to wallet when stream completes
  useEffect(() => {
    console.log("🚀 Wallet Trigger Effect Check:", {
      isComplete,
      accumulatedTransactionsLength: accumulatedTransactions.length,
      sendingToWallet,
      walletSuccess,
      walletError,
      isOptimizing,
      timestamp: new Date().toISOString(),
    });

    const shouldSendToWallet =
      isComplete &&
      accumulatedTransactions.length > 0 &&
      !sendingToWallet &&
      !walletSuccess &&
      !walletError;

    console.log("📊 Should send to wallet:", shouldSendToWallet, {
      breakdown: {
        isComplete,
        hasTransactions: accumulatedTransactions.length > 0,
        notSendingToWallet: !sendingToWallet,
        notWalletSuccess: !walletSuccess,
        notWalletError: !walletError,
      },
    });

    if (shouldSendToWallet) {
      console.log("🎯 TRIGGERING handleSendToWallet");
      handleSendToWallet();
    } else {
      console.log("🚫 NOT triggering handleSendToWallet - conditions not met");
    }
  }, [
    isComplete,
    accumulatedTransactions.length,
    sendingToWallet,
    walletSuccess,
    walletError,
    handleSendToWallet,
  ]);

  // Handler for cancelling wallet operation
  const handleCancelWalletOperation = useCallback(() => {
    cancelOperation("User cancelled wallet operation");
    setSendingToWallet(false);
  }, [cancelOperation]);

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
            rebalanceActions: mockOptimizationData.rebalanceActions,
            chainCount: mockOptimizationData.chainCount,
          }}
        />
      </GlassCard>

      {/* Streaming Progress */}
      {(isStreaming || events.length > 0) && (
        <GlassCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">DustZap Progress</h3>
              <div className="text-sm text-gray-400">
                {isStreaming ? "Processing..." : "Complete"}
              </div>
            </div>

            {totalTokens > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Token Conversion</span>
                  <span>
                    {processedTokens}/{totalTokens}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {batchesCompleted > 0 && (
              <div className="text-sm text-gray-400">
                Batches completed: {batchesCompleted}
              </div>
            )}

            {(streamError || tokensError || walletError) && (
              <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
                Error: {streamError || tokensError || walletError}
                {walletError && (
                  <button
                    onClick={handleSendToWallet}
                    className="ml-2 text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                    disabled={sendingToWallet}
                  >
                    Retry Wallet
                  </button>
                )}
              </div>
            )}

            {/* Enhanced Wallet Transaction Progress */}
            <WalletTransactionProgress
              isVisible={
                sendingToWallet || walletSuccess || batchProgress.length > 0
              }
              overallStatus={
                walletSuccess
                  ? "completed"
                  : sendingToWallet
                    ? "processing"
                    : walletError
                      ? "failed"
                      : operationStatus === "cancelled"
                        ? "cancelled"
                        : "idle"
              }
              batches={batchProgress}
              currentBatch={currentBatchIndex}
              totalTransactions={accumulatedTransactions.length}
              completedTransactions={batchProgress.reduce(
                (sum, batch) =>
                  sum +
                  (batch.status === "completed" ? batch.transactionCount : 0),
                0
              )}
              estimatedTotalTime={totalEstimatedTime}
              elapsedTime={elapsedTime}
              canCancel={sendingToWallet && operationStatus === "running"}
              onCancel={handleCancelWalletOperation}
              walletType={getSimpleWalletName(activeAccount)}
            />

            {/* Enhanced Trading Summary */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700/50">
              <div className="grid grid-cols-3 gap-4 mb-3">
                {/* Total Input Value */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Input Value</div>
                  <div className="font-semibold text-blue-400">
                    $
                    {formatSmallNumber(
                      events
                        .filter(
                          (e: any) => e.type === "token_ready" && e.tradingLoss
                        )
                        .reduce(
                          (sum, e: any) =>
                            sum + (e.tradingLoss?.inputValueUSD || 0),
                          0
                        )
                    )}
                  </div>
                </div>

                {/* Total Output Value */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">Output Value</div>
                  <div className="font-semibold text-green-400">
                    $
                    {formatSmallNumber(
                      events
                        .filter(
                          (e: any) => e.type === "token_ready" && e.tradingLoss
                        )
                        .reduce(
                          (sum, e: any) =>
                            sum + (e.tradingLoss?.outputValueUSD || 0),
                          0
                        )
                    )}
                  </div>
                </div>

                {/* Trading Impact */}
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-1">
                    Trading Impact
                  </div>
                  {(() => {
                    const totalTradingLoss = events
                      .filter(
                        (e: any) => e.type === "token_ready" && e.tradingLoss
                      )
                      .reduce(
                        (sum, e: any) => sum + (e.tradingLoss?.netLossUSD || 0),
                        0
                      );
                    const isGain = totalTradingLoss < 0; // Negative = gain
                    const isBreakEven = Math.abs(totalTradingLoss) < 0.01;

                    return (
                      <div
                        className={`font-semibold ${
                          isBreakEven
                            ? "text-gray-400"
                            : isGain
                              ? "text-green-400"
                              : "text-red-400"
                        }`}
                      >
                        {isGain ? "+" : ""}$
                        {formatSmallNumber(Math.abs(totalTradingLoss))}
                        <div className="text-xs mt-1">
                          {isBreakEven
                            ? "Break Even"
                            : isGain
                              ? "Arbitrage Gain"
                              : "Trading Loss"}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Technical Details Toggle */}
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showTechnicalDetails ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
                {showTechnicalDetails ? "Hide" : "Show"} Technical Details
              </button>
            </div>

            {/* Scrollable Events List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {events
                .filter(
                  (event: any) => event.type === "token_ready" && event.provider
                )
                .map((event: any, index) => {
                  const tradingLoss = event.tradingLoss;
                  const inputValue = tradingLoss?.inputValueUSD || 0;
                  const outputValue = tradingLoss?.outputValueUSD || 0;
                  const netLoss = tradingLoss?.netLossUSD || 0;
                  const lossPercentage = tradingLoss?.lossPercentage || 0;
                  const gasCost = event.gasCostUSD || 0;

                  return (
                    <div
                      key={index}
                      className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30"
                    >
                      {/* Main conversion info */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ImageWithFallback
                            src={`https://zap-assets-worker.davidtnfsh.workers.dev/tokenPictures/${event.tokenSymbol?.toLowerCase()}.webp`}
                            alt={event.tokenSymbol || "Token"}
                            fallbackType="token"
                            symbol={event.tokenSymbol}
                            size={20}
                          />
                          <span className="font-medium text-blue-300 text-sm">
                            {event.tokenSymbol || "Token"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">via</span>
                          <ImageWithFallback
                            src={`https://zap-assets-worker.davidtnfsh.workers.dev/projectPictures/${event.provider?.toLowerCase()}.webp`}
                            alt={event.provider || "Provider"}
                            fallbackType="project"
                            symbol={event.provider}
                            size={16}
                          />
                          <span className="text-green-400 text-sm">
                            {event.provider}
                          </span>
                        </div>
                      </div>

                      {/* Simplified info - always visible */}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">
                          ${formatSmallNumber(inputValue)} converted
                        </span>
                        {(() => {
                          const isGain = netLoss < 0; // Negative = gain
                          const isBreakEven = Math.abs(netLoss) < 0.01;

                          return (
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs ${
                                  isBreakEven
                                    ? "text-gray-400"
                                    : isGain
                                      ? "text-green-400"
                                      : "text-red-400"
                                }`}
                              >
                                {isBreakEven
                                  ? "Break Even"
                                  : isGain
                                    ? "Arbitrage +"
                                    : "Loss -"}
                                ${formatSmallNumber(Math.abs(netLoss))}
                              </span>
                              <span className="text-green-400">✓</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Technical details - only when expanded */}
                      {showTechnicalDetails && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Input Value:</span>
                            <span>${formatSmallNumber(inputValue)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Output Value:</span>
                            <span>${formatSmallNumber(outputValue)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            {(() => {
                              const isGain = netLoss < 0; // Negative = gain
                              const isBreakEven = Math.abs(netLoss) < 0.01;

                              return (
                                <>
                                  <span>
                                    {isBreakEven
                                      ? "Trading Impact:"
                                      : isGain
                                        ? "Arbitrage Gain:"
                                        : "Trading Loss:"}
                                  </span>
                                  <span
                                    className={
                                      isBreakEven
                                        ? "text-gray-400"
                                        : isGain
                                          ? "text-green-400"
                                          : "text-red-400"
                                    }
                                  >
                                    {isGain ? "+" : ""}$
                                    {formatSmallNumber(Math.abs(netLoss))} (
                                    {lossPercentage >= 0 ? "" : "+"}
                                    {formatSmallNumber(
                                      Math.abs(lossPercentage)
                                    )}
                                    %)
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Gas Cost:</span>
                            <span>${formatSmallNumber(gasCost)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </GlassCard>
      )}
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
              selectedCount === 0 ||
              isOptimizing ||
              isStreaming ||
              sendingToWallet ||
              loadingTokens ||
              !isWalletConnected
            }
            gradient="from-purple-600 to-blue-600"
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

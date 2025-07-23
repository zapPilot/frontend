"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { useDustZapStream } from "../../hooks/useDustZapStream";
import { transformToDebankChainName } from "../../utils/chainHelper";
import { getTokens } from "../../utils/dustConversion";
import { formatSmallNumber } from "../../utils/formatters";
import { getTokenSymbol } from "../../utils/tokenUtils";
import { TokenImage } from "../shared/TokenImage";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { GlassCard, GradientButton } from "../ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import { OptimizationSelector } from "./OptimizationSelector";
import { SlippageSelector } from "./SlippageSelector";

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
    [filteredDustTokens]
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

  // Effect to handle stream completion
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

            {(streamError || tokensError) && (
              <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
                Error: {streamError || tokensError}
              </div>
            )}

            {/* Conversion Summary */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700/50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-300 font-medium">
                  Total Value Converted:
                </span>
                <span className="text-lg font-bold text-green-400">
                  $
                  {events
                    .filter(
                      (e: any) => e.type === "token_ready" && e.tradingLoss
                    )
                    .reduce(
                      (sum, e: any) =>
                        sum + (e.tradingLoss?.inputValueUSD || 0),
                      0
                    )
                    .toFixed(2)}
                </span>
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
                          ${inputValue.toFixed(2)} converted
                        </span>
                        <span className="text-green-400">✓ Complete</span>
                      </div>

                      {/* Technical details - only when expanded */}
                      {showTechnicalDetails && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Input Value:</span>
                            <span>${inputValue.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Output Value:</span>
                            <span>${outputValue.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Trading Loss:</span>
                            <span
                              className={
                                netLoss > 0 ? "text-red-400" : "text-green-400"
                              }
                            >
                              ${netLoss.toFixed(4)} ({lossPercentage.toFixed(1)}
                              %)
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Gas Cost:</span>
                            <span>${gasCost.toFixed(4)}</span>
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

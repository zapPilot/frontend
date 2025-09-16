"use client";
import { GRADIENTS } from "@/constants/design-system";
import { useCallback, useEffect, useState } from "react";
import {
  useActiveAccount,
  useActiveWalletChain,
  useSendAndConfirmCalls,
} from "thirdweb/react";
import { useDustZapStream } from "../../hooks/useDustZapStream";
import { useToast } from "../../hooks/useToast";
import { formatSmallNumber } from "../../lib/formatters";
import { getTokenSymbol } from "../../utils/tokenUtils";
import { SlippageComponent } from "../shared/SlippageComponent";
import { TokenImage } from "../shared/TokenImage";
import { GlassCard, GradientButton } from "../ui";
import { useOptimizationData } from "./hooks/useOptimizationData";
import { useTokenManagement } from "./hooks/useTokenManagement";
import { useUIState } from "./hooks/useUIState";
import { useWalletTransactions } from "./hooks/useWalletTransactions";
import { OptimizationSelector } from "./OptimizationSelector";
import { StreamingProgress } from "./StreamingProgress";
import { executeDustZap } from "../../services/intentService";
import { IntentServiceError } from "../../lib/base-error";
import {
  WalletConnectionState,
  DustToken,
  OptimizationOptions,
  OptimizationData,
  CompleteEventData,
} from "../../types/optimize";

// ===== EXTRACTED HOOKS AND INTERFACES =====

// Wallet API types
interface SendCallsParameter {
  calls: unknown[]; // Thirdweb call structure opaque to app layer
}

// Wallet connection hook interface - using WalletConnectionState directly

// Intent creation hook interface
interface UseIntentCreationReturn {
  createDustZapIntent: (
    userAddress: string,
    chainId: number,
    filteredDustTokens: DustToken[],
    slippage: number
  ) => Promise<string>;
}

// Optimization workflow hook interface
interface UseOptimizationWorkflowReturn {
  handleOptimize: () => Promise<void>;
}

// Button state hook interface
interface UseOptimizeButtonStateReturn {
  buttonText: string;
}

// Sub-component interfaces
interface OptimizationControlsProps {
  optimizationOptions: OptimizationOptions;
  setOptimizationOptions: (options: OptimizationOptions) => void;
  dustTokens: DustToken[];
  loadingTokens: boolean;
  optimizationData: OptimizationData;
}

interface ExecutionPanelProps {
  optimizationOptions: OptimizationOptions;
  setOptimizationOptions: (
    options:
      | OptimizationOptions
      | ((prev: OptimizationOptions) => OptimizationOptions)
  ) => void;
  isWalletConnected: boolean;
  optimizationData: OptimizationData;
  isOptimizing: boolean;
  isStreaming: boolean;
  sendingToWallet: boolean;
  loadingTokens: boolean;
  buttonText: string;
  onOptimize: () => void;
}
// Remove local declarations - use imported types from ../types/optimize

interface TokenGridProps {
  tokens: DustToken[];
  showDetails: boolean;
  onToggleDetails: () => void;
  onDeleteToken: (tokenId: string) => void;
  deletedTokenIds: Set<string>;
  onRestoreDeletedTokens: () => void;
}

// ===== EXTRACTED CUSTOM HOOKS =====

// Hook for wallet connection state management
const useWalletConnectionState = (): WalletConnectionState => {
  const activeAccount = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const { mutate: sendCalls } = useSendAndConfirmCalls();

  const getExplorerUrl = useCallback(
    (txnHash: string) => {
      const baseUrl = activeChain?.blockExplorers?.[0]?.url;
      return baseUrl ? `${baseUrl}/tx/${txnHash}` : null;
    },
    [activeChain]
  );

  return {
    activeAccount: activeAccount
      ? {
          address: activeAccount.address,
          status: "connected" as const,
        }
      : null,
    activeChain: activeChain
      ? {
          id: activeChain.id,
          name: activeChain.name || "Unknown Chain",
          nativeCurrency: {
            symbol: activeChain.nativeCurrency?.symbol || "ETH",
            name: activeChain.nativeCurrency?.name || "Ethereum",
            decimals: activeChain.nativeCurrency?.decimals || 18,
          },
          rpcUrls: {
            default: {
              http: activeChain.rpc
                ? [activeChain.rpc]
                : ["https://mainnet.infura.io/v3/"],
            },
          },
          ...(activeChain.blockExplorers && {
            blockExplorers: {
              default: {
                name: activeChain.blockExplorers[0]?.name || "Explorer",
                url: activeChain.blockExplorers[0]?.url || "",
              },
            },
          }),
        }
      : null,
    sendCalls: async calls => {
      const result = await sendCalls({ calls } as SendCallsParameter);
      return {
        transactionHash: (result as { transactionHash?: string } | undefined)?.
          transactionHash || "",
        status: "success" as const,
      };
    },
    userAddress: activeAccount?.address,
    chainId: activeChain?.id,
    chainName: activeChain?.name,
    isWalletConnected: !!activeAccount,
    getExplorerUrl,
  };
};

// Toast function type
type ToastFunction = (toast: {
  type: "success" | "error" | "info";
  title: string;
  message: string;
  duration?: number;
  link?: { text: string; url: string };
}) => void;

// Hook for intent creation API integration
const useIntentCreation = (
  showToast: ToastFunction
): UseIntentCreationReturn => {
  const createDustZapIntent = useCallback(
    async (
      userAddress: string,
      chainId: number,
      filteredDustTokens: DustToken[],
      slippage: number
    ) => {
      try {
        const result = await executeDustZap(userAddress, chainId, {
          slippage,
          dustTokens: filteredDustTokens
            .filter(token => token.raw_amount_hex_str) // Only include tokens with raw_amount_hex_str
            .map(token => ({
              address: token.id,
              symbol: token.optimized_symbol || token.symbol,
              amount: token.amount,
              price: token.price,
              decimals: token.decimals,
              raw_amount_hex_str: token.raw_amount_hex_str!,
            })),
          toTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
          toTokenDecimals: 18,
        });

        return result.intentId;
      } catch (error) {
        let errorMessage = "An unexpected error occurred";

        if (error instanceof IntentServiceError) {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        showToast({
          type: "error",
          title: "Optimization Failed",
          message: `Unable to prepare optimization: ${errorMessage}`,
          duration: 8000,
        });
        throw error;
      }
    },
    [showToast]
  );

  return { createDustZapIntent };
};

// Hook for optimization workflow orchestration
const useOptimizationWorkflow = ({
  optimizationOptions,
  filteredDustTokens,
  userAddress,
  chainId,
  deletedTokenIds,
  createDustZapIntent,
  startStreaming,
  clearEvents,
  resetWalletState,
  showToast,
  setIsOptimizing,
}: {
  optimizationOptions: OptimizationOptions;
  filteredDustTokens: DustToken[];
  userAddress: string | undefined;
  chainId: number | undefined;
  deletedTokenIds: Set<string>;
  createDustZapIntent: UseIntentCreationReturn["createDustZapIntent"];
  startStreaming: (intentId: string) => Promise<void>;
  clearEvents: () => void;
  resetWalletState: () => void;
  showToast: ToastFunction;
  setIsOptimizing: (isOptimizing: boolean) => void;
}): UseOptimizationWorkflowReturn => {
  const handleOptimize = useCallback(async () => {
    if (
      !optimizationOptions.convertDust &&
      !optimizationOptions.rebalancePortfolio
    ) {
      return;
    }

    setIsOptimizing(true);
    clearEvents();
    resetWalletState();

    try {
      if (optimizationOptions.convertDust && filteredDustTokens.length > 0) {
        if (!userAddress || !chainId) {
          throw new Error(
            "Wallet must be connected to perform dust conversion"
          );
        }

        const hasDeletedTokens = filteredDustTokens.some(token =>
          deletedTokenIds.has(token.id)
        );
        if (hasDeletedTokens) {
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

        await startStreaming(newIntentId);
      } else {
        setTimeout(() => {
          setIsOptimizing(false);
        }, 12000);
      }
    } catch (error) {
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
    deletedTokenIds,
    resetWalletState,
    showToast,
    setIsOptimizing,
  ]);

  return { handleOptimize };
};

// Hook for button state computation
const useOptimizeButtonState = ({
  optimizationOptions,
  isStreaming,
  isOptimizing,
  totalTokens,
  processedTokens,
  isWalletConnected,
  sendingToWallet,
  walletSuccess,
}: {
  optimizationOptions: OptimizationOptions;
  isStreaming: boolean;
  isOptimizing: boolean;
  totalTokens: number;
  processedTokens: number;
  isWalletConnected: boolean;
  sendingToWallet: boolean;
  walletSuccess: boolean;
}): UseOptimizeButtonStateReturn => {
  const buttonText = useCallback(() => {
    const { convertDust, rebalancePortfolio } = optimizationOptions;

    if (!isWalletConnected) {
      return "Connect Wallet to Optimize";
    }

    if (sendingToWallet) {
      return "Confirming in Wallet...";
    }

    if (walletSuccess) {
      return "✓ Optimization Complete";
    }

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
  ])();

  return { buttonText };
};

// ===== EXTRACTED SUB-COMPONENTS =====

// Optimization controls sub-component
const OptimizationControls: React.FC<OptimizationControlsProps> = ({
  optimizationOptions,
  setOptimizationOptions,
  dustTokens,
  loadingTokens,
  optimizationData,
}) => (
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
);

// Execution panel sub-component
const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  optimizationOptions,
  setOptimizationOptions,
  isWalletConnected,
  optimizationData,
  isOptimizing,
  isStreaming,
  sendingToWallet,
  loadingTokens,
  buttonText,
  onOptimize,
}) => (
  <GlassCard>
    <div className="space-y-4">
      <SlippageComponent
        value={optimizationOptions.slippage}
        onChange={slippage =>
          setOptimizationOptions(prev => ({ ...prev, slippage }))
        }
        context="swap"
        variant="expanded"
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
        onClick={onOptimize}
      >
        {buttonText}
      </GradientButton>
    </div>
  </GlassCard>
);

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
  // Toast notifications
  const { showToast } = useToast();

  // Extracted wallet connection hook
  const walletConnection = useWalletConnectionState();

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
  } = useTokenManagement(toast =>
    showToast({
      ...toast,
      type: toast.type as "success" | "error" | "info",
    })
  );

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
    sendCalls: walletConnection.sendCalls,
    activeAccount: walletConnection.activeAccount || {
      address: "",
      status: "disconnected" as const,
    },
    activeChain: walletConnection.activeChain
      ? {
          id: walletConnection.activeChain.id,
          name: walletConnection.activeChain.name,
          nativeCurrency: walletConnection.activeChain.nativeCurrency,
          rpcUrls: walletConnection.activeChain.rpcUrls,
          ...(walletConnection.activeChain.blockExplorers && {
            blockExplorers: walletConnection.activeChain.blockExplorers,
          }),
          rpc:
            walletConnection.activeChain.rpcUrls.default.http[0] ||
            "https://mainnet.infura.io/v3/",
        }
      : {
          id: 1,
          name: "Ethereum",
          nativeCurrency: { symbol: "ETH", name: "Ethereum", decimals: 18 },
          rpcUrls: { default: { http: ["https://mainnet.infura.io/v3/"] } },
          rpc: "https://mainnet.infura.io/v3/",
        },
    showToast,
    getExplorerUrl: walletConnection.getExplorerUrl,
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
    isWalletConnected: walletConnection.isWalletConnected,
    isLoading: loadingTokens,
  });

  // Extracted hooks
  const { createDustZapIntent } = useIntentCreation(showToast);
  const { handleOptimize } = useOptimizationWorkflow({
    optimizationOptions,
    filteredDustTokens,
    userAddress: walletConnection.userAddress,
    chainId: walletConnection.chainId,
    deletedTokenIds,
    createDustZapIntent,
    startStreaming,
    clearEvents,
    resetWalletState,
    showToast,
    setIsOptimizing,
  });
  const { buttonText } = useOptimizeButtonState({
    optimizationOptions,
    isStreaming,
    isOptimizing,
    totalTokens,
    processedTokens,
    isWalletConnected: walletConnection.isWalletConnected,
    sendingToWallet,
    walletSuccess,
  });

  // Data synchronization effects
  useEffect(() => {
    if (!walletConnection.userAddress || !walletConnection.chainName) {
      return;
    }
    fetchDustTokens(walletConnection.chainName, walletConnection.userAddress);
  }, [
    walletConnection.userAddress,
    walletConnection.chainName,
    fetchDustTokens,
  ]);

  // Effect to collect transactions only from complete event
  useEffect(() => {
    // Only use the authoritative complete event for wallet transactions
    const completeEvent = (
      events as Array<{ type?: string; data?: unknown }>
    ).find(
      event => event.type === "complete"
    );

    if (
      completeEvent &&
      completeEvent.data &&
      typeof completeEvent.data === "object" &&
      "transactions" in completeEvent.data
    ) {
      const eventData = completeEvent.data as CompleteEventData;
      if (eventData.transactions) {
        setAccumulatedTransactions(eventData.transactions);
      }
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

  // Render orchestration - clean component composition
  return (
    <div className="space-y-6" data-testid="optimize-tab-cards">
      <OptimizationControls
        optimizationOptions={optimizationOptions}
        setOptimizationOptions={setOptimizationOptions}
        dustTokens={dustTokens}
        loadingTokens={loadingTokens}
        optimizationData={optimizationData}
      />

      {walletConnection.activeAccount && (
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
          activeAccount={walletConnection.activeAccount}
          showTechnicalDetails={showTechnicalDetails}
          onToggleTechnicalDetails={handleToggleTechnicalDetails}
        />
      )}

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

      <ExecutionPanel
        optimizationOptions={optimizationOptions}
        setOptimizationOptions={setOptimizationOptions}
        isWalletConnected={walletConnection.isWalletConnected}
        optimizationData={optimizationData}
        isOptimizing={isOptimizing}
        isStreaming={isStreaming}
        sendingToWallet={sendingToWallet}
        loadingTokens={loadingTokens}
        buttonText={buttonText}
        onOptimize={handleOptimize}
      />
    </div>
  );
}

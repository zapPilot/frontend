import { useCallback, useState } from "react";
import { prepareTransaction } from "thirdweb";
import THIRDWEB_CLIENT from "../../../utils/thirdweb";
import {
  createTransactionBatches,
  getWalletBatchConfig,
} from "../../../utils/walletBatching";
import { portfolioStateUtils } from "@/utils/portfolio.utils";
import {
  BatchProgress,
  WalletTransactionState,
  PreparedTransaction,
  ToastMessage,
} from "../../../types/optimize";
import { ThirdWebAccount, ThirdWebChain } from "../../../types/api";

interface UseWalletTransactionsProps {
  sendCalls: (
    calls: PreparedTransaction[]
  ) => Promise<{ transactionHash: string }>;
  activeAccount: ThirdWebAccount;
  activeChain: ThirdWebChain;
  showToast: (toast: ToastMessage) => void;
  getExplorerUrl: (txHash: string) => string | null;
}

interface UseWalletTransactionsReturn {
  // State
  transactions: PreparedTransaction[];
  status: "idle" | "sending" | "success" | "error";
  error: string | null;
  batchProgress: BatchProgress[];
  currentBatch: number;

  // Computed booleans for cleaner code
  isSending: boolean;
  isSuccess: boolean;
  isError: boolean;
  hasTransactions: boolean;

  // Actions
  setTransactions: (transactions: PreparedTransaction[]) => void;
  sendToWallet: () => Promise<void>;
  autoSendWhenReady: (isComplete: boolean) => void;
  reset: () => void;
  clearError: () => void;
}

export function useWalletTransactions({
  sendCalls,
  activeAccount,
  activeChain,
  showToast,
  getExplorerUrl,
}: UseWalletTransactionsProps): UseWalletTransactionsReturn {
  const [state, setState] = useState<WalletTransactionState>({
    transactions: [],
    status: "idle",
    error: null,
    batchProgress: [],
    currentBatch: 0,
  });

  // Computed booleans
  const isSending = state.status === "sending";
  const isSuccess = state.status === "success";
  const isError = state.status === "error";
  const hasTransactions = portfolioStateUtils.hasItems(state.transactions);

  const setTransactions = useCallback((transactions: PreparedTransaction[]) => {
    setState(prev => ({ ...prev, transactions }));
  }, []);

  const reset = useCallback(() => {
    setState({
      transactions: [],
      status: "idle",
      error: null,
      batchProgress: [],
      currentBatch: 0,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, status: "idle" }));
  }, []);

  const sendToWallet = useCallback(async () => {
    if (portfolioStateUtils.isEmptyArray(state.transactions)) {
      return;
    }

    try {
      // Get wallet batch configuration
      // Convert ThirdWebAccount to WalletAccount for compatibility
      const walletAccount = {
        address: activeAccount.address,
        isConnected: true,
        balance: "0", // This is just for batching config, balance not critical
      };
      const batchConfig = getWalletBatchConfig(walletAccount);

      // Create transaction batches with optimal size
      const transactionBatches = createTransactionBatches(
        state.transactions,
        batchConfig.batchSize
      );

      // Initialize batch progress tracking
      const initialBatchProgress: BatchProgress[] = transactionBatches.map(
        (batch, index) => ({
          batchIndex: index,
          totalBatches: transactionBatches.length,
          transactionCount: batch.length,
          status: "pending" as const,
          transactions: batch,
          processedTokens: 0,
          totalTokens: batch.length,
        })
      );

      setState(prev => ({
        ...prev,
        status: "sending",
        error: null,
        batchProgress: initialBatchProgress,
        currentBatch: 0,
      }));

      try {
        // Process each batch sequentially with fail-fast logic
        for (
          let batchIndex = 0;
          batchIndex < transactionBatches.length;
          batchIndex++
        ) {
          const batch = transactionBatches[batchIndex];
          if (!batch) {
            throw new Error(`Batch ${batchIndex + 1} is undefined`);
          }

          // Update current batch index and status
          setState(prev => ({
            ...prev,
            currentBatch: batchIndex,
            batchProgress: prev.batchProgress.map((bp, i) =>
              i === batchIndex ? { ...bp, status: "processing" } : bp
            ),
          }));

          try {
            // Convert batch to ThirdWeb calls format using prepareTransaction
            const calls = batch.map(tx => {
              const rpcUrl = activeChain.rpcUrls.default.http[0];
              if (!rpcUrl) {
                throw new Error("No RPC URL available for chain");
              }
              const chainWithRpc = {
                id: activeChain.id,
                name: activeChain.name,
                nativeCurrency: activeChain.nativeCurrency,
                rpc: rpcUrl,
                rpcUrls: activeChain.rpcUrls,
                ...(activeChain.blockExplorers && {
                  blockExplorers: [
                    {
                      name: activeChain.blockExplorers.default.name,
                      url: activeChain.blockExplorers.default.url,
                    },
                  ],
                }),
              };
              return prepareTransaction({
                to: tx.to as `0x${string}`,
                chain: chainWithRpc,
                client: THIRDWEB_CLIENT,
                data: (tx.data || "0x") as `0x${string}`,
                ...(tx.value ? { value: BigInt(tx.value) } : {}),
                ...(tx.gas ? { gas: BigInt(tx.gas) } : {}),
              });
            });

            // Send batch to wallet
            const result = await sendCalls(calls as PreparedTransaction[]);

            // Extract transaction hash
            const txnHash = result?.transactionHash;

            if (txnHash) {
              const explorerUrl = getExplorerUrl(txnHash);

              showToast({
                type: "success",
                title: `Batch ${batchIndex + 1} Complete`,
                message: `Transaction submitted successfully`,
                duration: 8000,
                ...(explorerUrl && {
                  link: {
                    text: "View Transaction",
                    url: explorerUrl,
                  },
                }),
              });
            } else {
              showToast({
                type: "success",
                title: `Batch ${batchIndex + 1} Complete`,
                message: `Transaction submitted successfully`,
                duration: 6000,
              });
            }

            // Mark batch as completed
            setState(prev => ({
              ...prev,
              batchProgress: prev.batchProgress.map((bp, i) =>
                i === batchIndex ? { ...bp, status: "completed" } : bp
              ),
            }));

            // Add delay between batches to prevent overwhelming the wallet
            if (batchIndex < transactionBatches.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (batchError: unknown) {
            // FAIL FAST: If any batch fails, stop immediately

            const errorMessage =
              batchError instanceof Error
                ? batchError.message
                : "Unknown error";

            setState(prev => ({
              ...prev,
              batchProgress: prev.batchProgress.map((bp, i) =>
                i === batchIndex
                  ? {
                      ...bp,
                      status: "failed",
                      error: errorMessage,
                    }
                  : bp
              ),
            }));

            // Throw error to stop processing - dependent transactions will fail anyway
            throw new Error(
              `Transaction batch ${batchIndex + 1} failed: ${errorMessage}`
            );
          }
        }

        // All batches succeeded
        setState(prev => ({ ...prev, status: "success" }));
      } catch (operationError: unknown) {
        const errorMessage =
          operationError instanceof Error
            ? operationError.message
            : "Transaction processing failed";
        setState(prev => ({ ...prev, status: "error", error: errorMessage }));
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setState(prev => ({ ...prev, status: "error", error: errorMessage }));
    }
  }, [
    state.transactions,
    activeAccount,
    activeChain,
    sendCalls,
    showToast,
    getExplorerUrl,
  ]);

  const autoSendWhenReady = useCallback(
    (isComplete: boolean) => {
      const shouldSend =
        isComplete && hasTransactions && !isSending && !isSuccess && !isError;

      if (shouldSend) {
        sendToWallet();
      }
    },
    [hasTransactions, isSending, isSuccess, isError, sendToWallet]
  );

  return {
    // State
    transactions: state.transactions,
    status: state.status,
    error: state.error,
    batchProgress: state.batchProgress,
    currentBatch: state.currentBatch,

    // Computed booleans
    isSending,
    isSuccess,
    isError,
    hasTransactions,

    // Actions
    setTransactions,
    sendToWallet,
    autoSendWhenReady,
    reset,
    clearError,
  };
}

import { useCallback, useState } from "react";
import { prepareTransaction } from "thirdweb";
import THIRDWEB_CLIENT from "../../../utils/thirdweb";
import {
  createTransactionBatches,
  getWalletBatchConfig,
} from "../../../utils/walletBatching";
import { portfolioStateUtils } from "@/utils/portfolioTransformers";

interface BatchProgress {
  batchIndex: number;
  totalBatches: number;
  transactionCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  transactions: any[];
  error?: string;
}

interface WalletTransactionState {
  transactions: any[];
  status: "idle" | "sending" | "success" | "error";
  error: string | null;
  batchProgress: BatchProgress[];
  currentBatch: number;
}

interface UseWalletTransactionsProps {
  sendCalls: any; // thirdweb useSendAndConfirmCalls mutate function
  activeAccount: any;
  activeChain: any;
  showToast: (toast: {
    type: string;
    title: string;
    message: string;
    duration?: number;
    link?: { text: string; url: string };
  }) => void;
  getExplorerUrl: (txHash: string) => string | null;
}

interface UseWalletTransactionsReturn {
  // State
  transactions: any[];
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
  setTransactions: (transactions: any[]) => void;
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

  const setTransactions = useCallback((transactions: any[]) => {
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
      const batchConfig = getWalletBatchConfig(activeAccount);

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
              return prepareTransaction({
                to: tx.to,
                chain: activeChain!,
                client: THIRDWEB_CLIENT,
                data: tx.data || "0x",
                ...(tx.value ? { value: BigInt(tx.value) } : {}),
                ...(tx.gasLimit ? { extraGas: BigInt(tx.gasLimit) } : {}),
              });
            });

            // Send batch to wallet
            await new Promise<void>((resolve, reject) => {
              sendCalls(
                { calls, atomicRequired: false },
                {
                  onSuccess: (result: any) => {
                    // Extract transaction hash
                    const txnHash = result?.receipts?.[0]?.transactionHash;

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

                    resolve();
                  },
                  onError: (error: any) => {
                    showToast({
                      type: "error",
                      title: `Batch ${batchIndex + 1} Failed`,
                      message: error?.message || "Transaction failed",
                      duration: 10000,
                    });

                    reject(error);
                  },
                }
              );
            });

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

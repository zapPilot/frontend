/**
 * ZapExecutionProgress Component
 * Real-time progress display for UnifiedZap intent execution
 * Shows progress bar, current step, and execution details
 */

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { prepareTransaction } from "thirdweb";
import { useSendAndConfirmCalls } from "thirdweb/react";

import {
  getChainBlockExplorer,
  getChainById,
  isChainSupported,
  SUPPORTED_CHAINS,
  toThirdWebChain,
} from "../../config/chains";
import { Z_INDEX } from "../../constants/design-system";
import { useToast } from "../../hooks/useToast";
import {
  type UnifiedZapStreamTransaction,
  useUnifiedZapStream,
} from "../../hooks/useUnifiedZapStream";
import { formatAddress, formatCurrency } from "../../lib/formatters";
import {
  type BaseModalProps,
  type ZapExecutionResult,
} from "../../types/modal.types";
import THIRDWEB_CLIENT from "../../utils/thirdweb";

interface ZapExecutionProgressProps
  extends Omit<
    BaseModalProps<ZapExecutionResult>,
    "children" | "a11y" | "size"
  > {
  intentId: string;
  chainId: number;
  totalValue: number;
  strategyCount: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

type TransactionDispatchStatus = "idle" | "pending" | "success" | "error";

const shortenHash = (hash: string) =>
  formatAddress(hash, { prefixLength: 6, suffixLength: 4 });

/**
 * Maximum number of transactions per EIP-5792 bundle
 * wallet_sendCalls has a limit of 10 transactions per bundle
 */
const MAX_BUNDLE_SIZE = 10;

/**
 * Formats a phase string from snake_case to Title Case
 * E.g., "strategy_parsing" -> "Strategy Parsing"
 */
const formatPhaseString = (phase: string | undefined | null): string => {
  if (!phase) {
    return "Initializing";
  }
  return phase
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const parseBigIntValue = (value?: string): bigint | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    if (value.startsWith("0x") || value.startsWith("0X")) {
      return BigInt(value);
    }
    return BigInt(value);
  } catch {
    return undefined;
  }
};

const createTransactionSignature = (
  txs: UnifiedZapStreamTransaction[]
): string =>
  JSON.stringify(
    txs.map(tx => ({
      to: tx.to,
      data: tx.data,
      value: tx.value ?? null,
      gas: tx.gas ?? null,
      gasPrice: tx.gasPrice ?? null,
      maxFeePerGas: tx.maxFeePerGas ?? null,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas ?? null,
      chainId: tx.chainId ?? null,
    }))
  );

const buildExplorerUrl = (chainId: number, txHash: string): string | null => {
  const baseUrl = getChainBlockExplorer(chainId);
  if (!baseUrl) {
    return null;
  }

  const sanitizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return `${sanitizedBase}/tx/${txHash}`;
};

const deriveErrorMessage = (error: unknown): string => {
  if (!error) {
    return "Failed to dispatch transaction bundle.";
  }

  if (error instanceof Error) {
    const normalizedMessage = error.message?.trim();
    if (normalizedMessage?.length) {
      if (normalizedMessage.includes("wallet_sendCalls")) {
        return "Connected wallet does not support EIP-5792 (wallet_sendCalls). Switch to a thirdweb Smart Wallet or other compatible provider.";
      }
      if (normalizedMessage.includes("wallet_getCapabilities")) {
        return "Wallet capabilities could not be fetched. Ensure the wallet supports EIP-5792.";
      }
      return normalizedMessage;
    }
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim();
  }

  if (typeof (error as { message?: string }).message === "string") {
    return (error as { message?: string }).message as string;
  }

  return "Failed to dispatch transaction bundle.";
};

const ZapExecutionProgressComponent = ({
  isOpen,
  onClose,
  intentId,
  chainId,
  totalValue,
  strategyCount,
  onComplete,
  onError,
  onCancel,
  className = "",
}: ZapExecutionProgressProps) => {
  const {
    latestEvent,
    isConnected,
    isComplete,
    hasError,
    progress,
    currentStep,
    error,
    closeStream,
    transactions: streamTransactions,
  } = useUnifiedZapStream(intentId);

  const { mutate: sendCalls } = useSendAndConfirmCalls();
  const { showToast } = useToast();

  const lastSentSignatureRef = useRef<string | null>(null);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionDispatchStatus>("idle");

  // Chunk execution state
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [completedChunks, setCompletedChunks] = useState(0);
  const [failedAtChunk, setFailedAtChunk] = useState<number | null>(null);

  useEffect(() => {
    lastSentSignatureRef.current = null;
    setTransactionStatus("idle");
    setCurrentChunkIndex(0);
    setCompletedChunks(0);
    setFailedAtChunk(null);
  }, [intentId]);

  // Handle completion
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  // Handle errors
  useEffect(() => {
    if (hasError && onError) {
      const errorMessage =
        error || latestEvent?.error?.message || "Unknown error occurred";
      onError(errorMessage);
    }
  }, [hasError, error, latestEvent?.error?.message, onError]);

  const handleCancel = useCallback(() => {
    closeStream();
    if (onCancel) {
      onCancel();
    }
    onClose();
  }, [closeStream, onCancel, onClose]);

  // Handle Radix Dialog open state changes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Only allow close if execution is complete or failed
        if (isComplete || hasError) {
          onClose();
        } else {
          // During execution, allow backdrop/ESC to cancel
          handleCancel();
        }
      }
    },
    [isComplete, hasError, onClose, handleCancel]
  );

  const transactions = useMemo(
    () => streamTransactions ?? [],
    [streamTransactions]
  );

  const transactionSignature = useMemo(
    () =>
      transactions.length > 0 ? createTransactionSignature(transactions) : null,
    [transactions]
  );

  // Split transactions into chunks of MAX_BUNDLE_SIZE
  const chunks = useMemo(() => {
    if (!transactions.length) return [];
    const result: UnifiedZapStreamTransaction[][] = [];
    for (let i = 0; i < transactions.length; i += MAX_BUNDLE_SIZE) {
      result.push(transactions.slice(i, i + MAX_BUNDLE_SIZE));
    }
    return result;
  }, [transactions]);

  const progressPercentage = Math.round(progress * 100);

  const handleSendTransactions = useCallback(
    (
      txs: UnifiedZapStreamTransaction[],
      eventChainId: number | undefined,
      signature: string,
      chunkIndex: number,
      totalChunks: number
    ) => {
      if (!txs.length) {
        return;
      }

      const resolvedChainId =
        (typeof eventChainId === "number" && isChainSupported(eventChainId)
          ? eventChainId
          : undefined) ?? (isChainSupported(chainId) ? chainId : undefined);

      if (resolvedChainId === undefined) {
        const fallbackChainId =
          typeof eventChainId === "number" ? eventChainId : chainId;
        const supportedChainNames = SUPPORTED_CHAINS.map(
          c => `${c.name} (${c.id})`
        ).join(", ");

        const message = `Chain ${fallbackChainId} is not supported. Supported chains: ${supportedChainNames}`;
        setTransactionStatus("error");
        showToast({ type: "error", title: "Unsupported chain", message });
        return;
      }

      const baseChain = getChainById(resolvedChainId);

      if (!baseChain) {
        const supportedChainNames = SUPPORTED_CHAINS.map(
          c => `${c.name} (${c.id})`
        ).join(", ");

        const message = `Chain ${resolvedChainId} is not supported. Supported chains: ${supportedChainNames}`;
        setTransactionStatus("error");
        showToast({ type: "error", title: "Unsupported chain", message });
        return;
      }

      try {
        const thirdwebChain = toThirdWebChain(baseChain);

        const preparedCalls = txs
          .map<ReturnType<typeof prepareTransaction> | null>(tx => {
            if (!tx.to || !tx.data) {
              return null;
            }

            try {
              const prepared = prepareTransaction({
                to: tx.to as `0x${string}`,
                data: tx.data as `0x${string}`,
                value: parseBigIntValue(tx.value),
                extraGas: parseBigIntValue(tx.gas),
                gasPrice: parseBigIntValue(tx.gasPrice),
                maxFeePerGas: parseBigIntValue(tx.maxFeePerGas),
                maxPriorityFeePerGas: parseBigIntValue(tx.maxPriorityFeePerGas),
                chain: thirdwebChain,
                client: THIRDWEB_CLIENT,
              });
              return prepared;
            } catch {
              return null;
            }
          })
          .filter(
            (call): call is ReturnType<typeof prepareTransaction> =>
              call !== null
          );

        if (preparedCalls.length === 0) {
          const message =
            "No executable transactions were provided by the intent stream.";
          setTransactionStatus("error");
          showToast({ type: "error", title: "No transactions", message });
          return;
        }

        lastSentSignatureRef.current = signature;
        setTransactionStatus("pending");

        type SendCallsVariables = Parameters<typeof sendCalls>[0];

        const sendVariables: SendCallsVariables = {
          calls: preparedCalls as SendCallsVariables["calls"],
          // keep this testing settings
          // calls: [
          //   {
          //     to: "0xf97f4df75117a78c1a5a0dbb814af92458539fb4",
          //     data: "0x095ea7b3000000000000000000000000fb1b08ba6ba284934d817ea3c9d18f592cc59a50000000000000000000000000000000000000000000000000000407da105a96d0",
          //   },
          // ] as SendCallsVariables["calls"],
          atomicRequired: false,
        };

        sendCalls(sendVariables, {
          onSuccess: result => {
            const receiptHash = result?.receipts?.[0]?.transactionHash;
            const explorerUrl =
              receiptHash && resolvedChainId
                ? buildExplorerUrl(resolvedChainId, receiptHash)
                : null;

            // Update chunk completion state
            setCompletedChunks(prev => prev + 1);

            // Check if this is the last chunk
            if (chunkIndex === totalChunks - 1) {
              setTransactionStatus("success");
              showToast({
                type: "success",
                title: "All transactions submitted",
                message:
                  totalChunks > 1
                    ? `All ${totalChunks} batches completed successfully.`
                    : receiptHash
                      ? `Bundle sent. First transaction ${shortenHash(receiptHash)}.`
                      : "Bundle dispatched to wallet.",
                ...(explorerUrl
                  ? {
                      link: {
                        url: explorerUrl,
                        text: "View on explorer",
                      },
                    }
                  : {}),
              });
            } else {
              // More chunks to process, set status to idle to trigger next chunk
              setTransactionStatus("idle");
              setCurrentChunkIndex(chunkIndex + 1);
              showToast({
                type: "success",
                title: `Batch ${chunkIndex + 1} of ${totalChunks} completed`,
                message: receiptHash
                  ? `Transactions ${chunkIndex * MAX_BUNDLE_SIZE + 1}-${(chunkIndex + 1) * MAX_BUNDLE_SIZE} submitted. ${shortenHash(receiptHash)}`
                  : `Proceeding to batch ${chunkIndex + 2}...`,
              });
            }
          },
          onError: err => {
            setTransactionStatus("error");
            setFailedAtChunk(chunkIndex);
            const message = deriveErrorMessage(err);
            const partialSuccessInfo =
              chunkIndex > 0
                ? ` Successfully executed ${chunkIndex * MAX_BUNDLE_SIZE} transactions before failure.`
                : "";
            showToast({
              type: "error",
              title: `Batch ${chunkIndex + 1} of ${totalChunks} failed`,
              message: `${message}${partialSuccessInfo}`,
            });
          },
        });
      } catch (dispatchError) {
        setTransactionStatus("error");
        setFailedAtChunk(chunkIndex);
        const message = deriveErrorMessage(dispatchError);
        const partialSuccessInfo =
          chunkIndex > 0
            ? ` Successfully executed ${chunkIndex * MAX_BUNDLE_SIZE} transactions before failure.`
            : "";
        showToast({
          type: "error",
          title: `Dispatch error in batch ${chunkIndex + 1}`,
          message: `${message}${partialSuccessInfo}`,
        });
      }
    },
    [chainId, sendCalls, showToast]
  );

  // Chunk execution effect
  useEffect(() => {
    // Don't execute if no chunks or signature
    if (!chunks.length || !transactionSignature) {
      return;
    }

    // Don't execute if currently processing or in error state
    if (transactionStatus === "pending" || transactionStatus === "error") {
      return;
    }

    // Don't execute if we've already sent this signature for this chunk
    const currentChunkSignature = `${transactionSignature}-chunk-${currentChunkIndex}`;
    if (lastSentSignatureRef.current === currentChunkSignature) {
      return;
    }

    // Don't execute if we've completed all chunks or failed
    if (currentChunkIndex >= chunks.length || failedAtChunk !== null) {
      return;
    }

    // Execute current chunk
    const currentChunk = chunks[currentChunkIndex];
    if (!currentChunk) return; // Type safety: ensure chunk exists
    lastSentSignatureRef.current = currentChunkSignature;

    handleSendTransactions(
      currentChunk,
      latestEvent?.chainId,
      currentChunkSignature,
      currentChunkIndex,
      chunks.length
    );
  }, [
    chunks,
    transactionSignature,
    currentChunkIndex,
    transactionStatus,
    failedAtChunk,
    handleSendTransactions,
    latestEvent?.chainId,
  ]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {/* Backdrop with Framer Motion */}
        <Dialog.Overlay asChild>
          <motion.div
            className={`fixed inset-0 bg-black/40 backdrop-blur-sm ${Z_INDEX.MODAL}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </Dialog.Overlay>

        {/* Modal Content */}
        <Dialog.Content asChild onEscapeKeyDown={() => handleOpenChange(false)}>
          <motion.div
            className={`fixed inset-0 flex items-center justify-center px-4 py-10 ${Z_INDEX.MODAL}`}
            style={{ cursor: "pointer" }}
            onClick={e => {
              if (e.target === e.currentTarget) {
                handleOpenChange(false);
              }
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-gray-200 p-6 ${className}`}
              style={{ cursor: "default" }}
              onClick={e => e.stopPropagation()}
              data-testid="zap-execution-progress"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full text-white text-lg">
                    🚀
                  </div>
                  <div>
                    <Dialog.Title className="font-semibold text-gray-900">
                      UnifiedZap Execution
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-600">
                      {formatCurrency(totalValue)} • {strategyCount} strategies
                    </Dialog.Description>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Connection status */}
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs text-gray-500">
                      {isConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>

                  {/* Close/Cancel button - always visible */}
                  <Dialog.Close asChild>
                    <button
                      className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
                      data-testid="close-button"
                      aria-label="Close modal"
                    >
                      {!isComplete && !hasError ? "Cancel" : "✕"}
                    </button>
                  </Dialog.Close>
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-6">
                {/* Current Step */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <span className="text-2xl">
                      {hasError ? "❌" : isComplete ? "✅" : "⏳"}
                    </span>
                    {!isComplete && !hasError && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {formatPhaseString(latestEvent?.phase ?? currentStep)}
                      </h4>
                      <span className="text-sm font-medium text-purple-600">
                        {progressPercentage}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {chunks.length > 1 && transactionStatus === "pending"
                        ? `Executing batch ${currentChunkIndex + 1} of ${chunks.length} (${currentChunkIndex * MAX_BUNDLE_SIZE + 1}-${Math.min((currentChunkIndex + 1) * MAX_BUNDLE_SIZE, transactions.length)} of ${transactions.length} transactions)`
                        : chunks.length > 1 && completedChunks > 0
                          ? `Completed ${completedChunks} of ${chunks.length} batches`
                          : latestEvent?.phase || "Waiting for updates..."}
                    </p>
                  </div>
                </div>

                {/* Enhanced Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <motion.div
                      className={`h-3 rounded-full bg-gradient-to-r ${
                        hasError
                          ? "from-red-500 to-red-600"
                          : isComplete
                            ? "from-green-500 to-green-600"
                            : "from-purple-500 to-blue-600"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                    {/* Progress glow effect */}
                    <motion.div
                      className="absolute top-0 h-3 rounded-full bg-white opacity-30"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span className="font-medium">{progressPercentage}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export const ZapExecutionProgress = React.memo(ZapExecutionProgressComponent);

/**
 * ZapExecutionProgress Component
 * Real-time progress display for UnifiedZap intent execution
 * Shows progress bar, current step, and execution details
 */

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prepareTransaction } from "thirdweb";
import { useSendAndConfirmCalls } from "thirdweb/react";
import {
  getChainBlockExplorer,
  getChainById,
  toThirdWebChain,
} from "../../config/chains";
import { Z_INDEX } from "../../constants/design-system";
import { useToast } from "../../hooks/useToast";
import {
  useUnifiedZapStream,
  type UnifiedZapStreamEvent,
  type UnifiedZapStreamTransaction,
} from "../../hooks/useUnifiedZapStream";
import { formatCurrency } from "../../lib/formatters";
import {
  type BaseModalProps,
  type ZapExecutionResult,
} from "../../types/modal.types";
import THIRDWEB_CLIENT from "../../utils/thirdweb";

export interface ZapExecutionProgressProps
  extends Omit<
    BaseModalProps<ZapExecutionResult>,
    "children" | "a11y" | "size"
  > {
  intentId: string;
  chainId: number;
  totalValue: number;
  strategyCount: number;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

// Step display configuration with enhanced details
const STEP_CONFIG = {
  connected: {
    title: "Initializing",
    description: "Connecting to execution service",
    icon: "🔌",
    order: 0,
    color: "blue",
  },
  strategy_parsing: {
    title: "Parsing Strategies",
    description: "Analyzing strategy allocations",
    icon: "📊",
    order: 1,
    color: "purple",
  },
  token_analysis: {
    title: "Token Analysis",
    description: "Analyzing token requirements",
    icon: "🔍",
    order: 2,
    color: "indigo",
  },
  swap_preparation: {
    title: "Swap Preparation",
    description: "Preparing token swaps",
    icon: "🔄",
    order: 3,
    color: "cyan",
  },
  transaction_building: {
    title: "Building Transactions",
    description: "Constructing protocol transactions",
    icon: "⚙️",
    order: 4,
    color: "orange",
  },
  gas_estimation: {
    title: "Gas Estimation",
    description: "Calculating gas costs",
    icon: "⛽",
    order: 5,
    color: "yellow",
  },
  final_assembly: {
    title: "Final Assembly",
    description: "Finalizing transaction bundle",
    icon: "📦",
    order: 6,
    color: "green",
  },
  complete: {
    title: "Complete",
    description: "All operations completed successfully",
    icon: "✅",
    order: 7,
    color: "emerald",
  },
  error: {
    title: "Error",
    description: "Execution encountered an error",
    icon: "❌",
    order: -1,
    color: "red",
  },
};

type TransactionDispatchStatus = "idle" | "pending" | "success" | "error";

const shortenHash = (hash: string) =>
  hash.length <= 12 ? hash : `${hash.slice(0, 6)}…${hash.slice(-4)}`;

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

function EventStreamDebug({ events }: { events: UnifiedZapStreamEvent[] }) {
  return (
    <div className="border border-dashed border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Event Stream (debug)
        </h5>
        <span className="text-[10px] text-gray-400">
          {events.length} event{events.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-2">
        {events.length === 0 ? (
          <div className="text-xs text-gray-400">No events received yet</div>
        ) : (
          events.map((event, index) => (
            <div
              key={`${event.intentId ?? event.type ?? event.phase ?? "event"}-${index}`}
              className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-700"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-600">#{index + 1}</span>
                <span className="text-[11px] text-gray-400">
                  {event.type ?? event.phase ?? "event"}
                </span>
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-gray-600">
                {JSON.stringify(event, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ZapExecutionProgress({
  isOpen,
  onClose,
  intentId,
  chainId,
  totalValue,
  strategyCount,
  closeOnBackdropClick = false,
  closeOnEsc = true,
  onComplete,
  onError,
  onCancel,
  className = "",
}: ZapExecutionProgressProps) {
  const {
    events,
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

  useEffect(() => {
    lastSentSignatureRef.current = null;
    setTransactionStatus("idle");
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
        } else if (closeOnBackdropClick || closeOnEsc) {
          handleCancel();
        }
      }
    },
    [
      isComplete,
      hasError,
      closeOnBackdropClick,
      closeOnEsc,
      onClose,
      handleCancel,
    ]
  );

  const currentStepConfig = currentStep
    ? STEP_CONFIG[currentStep as keyof typeof STEP_CONFIG] ||
      STEP_CONFIG.connected
    : STEP_CONFIG.connected;

  const transactions = useMemo(
    () => streamTransactions ?? [],
    [streamTransactions]
  );

  const transactionSignature = useMemo(
    () =>
      transactions.length > 0 ? createTransactionSignature(transactions) : null,
    [transactions]
  );

  const progressPercentage = Math.round(progress * 100);

  const currentEventMessage = useMemo(() => {
    const message = latestEvent?.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message.trim();
    }
    return null;
  }, [latestEvent?.message]);

  const handleSendTransactions = useCallback(
    (
      txs: UnifiedZapStreamTransaction[],
      eventChainId: number | undefined,
      signature: string
    ) => {
      if (!txs.length) {
        return;
      }

      const chainIdForTx = eventChainId ?? chainId;
      const baseChain = getChainById(chainIdForTx);

      if (!baseChain) {
        const message = `Unsupported chain ${chainIdForTx}`;
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
                gas: parseBigIntValue(tx.gas),
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
          atomicRequired: true,
        };

        sendCalls(sendVariables, {
          onSuccess: async result => {
            setTransactionStatus("success");
            const receiptHash = result?.receipts?.[0]?.transactionHash;
            const explorerUrl =
              receiptHash && chainIdForTx
                ? buildExplorerUrl(chainIdForTx, receiptHash)
                : null;

            showToast({
              type: "success",
              title: "Transactions submitted",
              message: receiptHash
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
          },
          onError: async err => {
            setTransactionStatus("error");
            const message = deriveErrorMessage(err);
            showToast({
              type: "error",
              title: "Transaction dispatch failed",
              message,
            });
          },
        });
      } catch (dispatchError) {
        setTransactionStatus("error");
        const message = deriveErrorMessage(dispatchError);
        showToast({
          type: "error",
          title: "Dispatch error",
          message,
        });
      }
    },
    [chainId, sendCalls, showToast]
  );

  useEffect(() => {
    if (!transactions.length || !transactionSignature) {
      return;
    }

    if (transactionStatus === "pending") {
      return;
    }

    if (lastSentSignatureRef.current === transactionSignature) {
      return;
    }

    handleSendTransactions(
      transactions,
      latestEvent?.chainId,
      transactionSignature
    );
  }, [
    transactions,
    transactionSignature,
    handleSendTransactions,
    latestEvent?.chainId,
    transactionStatus,
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
        <Dialog.Content asChild>
          <motion.div
            className={`fixed inset-0 flex items-center justify-center px-4 py-10 ${Z_INDEX.MODAL}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-gray-200 p-6 ${className}`}
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
                    <span className="text-2xl">{currentStepConfig.icon}</span>
                    {currentStep ===
                      (latestEvent?.currentStep ??
                        latestEvent?.phase ??
                        latestEvent?.type) &&
                      !isComplete &&
                      !hasError && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                      )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {currentStepConfig.title}
                      </h4>
                      <span className="text-sm font-medium text-purple-600">
                        {progressPercentage}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {currentStepConfig.description}
                    </p>
                    {currentEventMessage && (
                      <p className="text-sm text-purple-700 mt-1">
                        {currentEventMessage}
                      </p>
                    )}
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

                <EventStreamDebug events={events} />
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

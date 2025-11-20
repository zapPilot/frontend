/**
 * useUnifiedZapStream Hook
 * Manages Server-Sent Events (SSE) streaming for UnifiedZap intent execution
 * Provides real-time progress updates and error handling with Zod validation
 */

/* eslint-disable sonarjs/deprecation */
import { useCallback, useEffect, useRef, useState } from "react";

import {
  safeHexishString,
  safeNumber,
  safeString,
} from "../lib/dataValidation";
import { API_ENDPOINTS } from "../lib/http-utils";
import {
  type NormalizedZapEvent,
  type UnifiedZapRawEvent,
  type UnifiedZapStreamTransaction,
  validateRawSSEEvent,
} from "../schemas/sseEventSchemas";
import { logger } from "../utils/logger";

const zapStreamLogger = logger.createContextLogger("UnifiedZapStream");

// ============================================================================
// Type Re-exports from Schema
// ============================================================================
// Note: All data structures are now defined in sseEventSchemas.ts
// These interfaces are kept for backward compatibility only

export const UNIFIED_ZAP_PHASES = [
  "connected",
  "strategy_parsing",
  "token_analysis",
  "swap_preparation",
  "transaction_building",
  "gas_estimation",
  "final_assembly",
  "complete",
  "error",
] as const;

type UnifiedZapPhase = (typeof UNIFIED_ZAP_PHASES)[number];

// Type aliases using validated schema types
type UnifiedZapStreamEvent = NormalizedZapEvent;
export type { UnifiedZapStreamTransaction };

interface UseUnifiedZapStreamReturn {
  events: UnifiedZapStreamEvent[];
  latestEvent: UnifiedZapStreamEvent | null;
  isConnected: boolean;
  isComplete: boolean;
  hasError: boolean;
  progress: number;
  currentStep: string | null;
  error: string | null;
  closeStream: () => void;
  reconnect: () => void;
  transactions: UnifiedZapStreamTransaction[];
}

/**
 * Custom hook for managing UnifiedZap SSE streaming
 * @param intentId - The intent ID to stream progress for
 * @param enabled - Whether to enable streaming (default: true when intentId is provided)
 */
export function useUnifiedZapStream(
  intentId: string | null,
  enabled = true
): UseUnifiedZapStreamReturn {
  const [events, setEvents] = useState<UnifiedZapStreamEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);
  const hasTerminalEventRef = useRef(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Derived state
  // Safe: Array access is guarded by length check
  const latestEvent = events.length > 0 ? events[events.length - 1]! : null;
  const isComplete = latestEvent?.type === "complete";
  const hasError = latestEvent?.type === "error" || error !== null;
  const progress = latestEvent?.progress ?? 0;
  const currentStep = latestEvent?.currentStep ?? null;
  const transactions = latestEvent?.transactions ?? [];

  // Maximum reconnection attempts
  const MAX_RECONNECT_ATTEMPTS = 3;
  const RECONNECT_DELAY = 2000; // 2 seconds

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connectToStream = useCallback(
    (intentId: string) => {
      if (eventSourceRef.current) {
        closeStream();
      }

      hasTerminalEventRef.current = false;

      try {
        // Construct stream URL using the configured intent engine endpoint
        const sanitizedBaseUrl = API_ENDPOINTS.intentEngine.replace(/\/$/, "");
        const streamPath = `/api/unifiedzap/${intentId}/stream`;
        const streamUrl = sanitizedBaseUrl
          ? `${sanitizedBaseUrl}${streamPath}`
          : streamPath;

        zapStreamLogger.info("Attempting SSE connection", {
          intentId,
          streamUrl,
          baseUrl: API_ENDPOINTS.intentEngine,
        });

        const eventSource = new EventSource(streamUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          zapStreamLogger.info("SSE connected successfully", {
            intentId,
            streamUrl,
            readyState: eventSource.readyState,
          });
          setIsConnected(true);
          setError(null);
          setReconnectAttempts(0);
        };

        eventSource.onmessage = event => {
          try {
            // Parse and validate raw SSE event data with Zod
            const parseResult = validateRawSSEEvent(JSON.parse(event.data));

            if (!parseResult.success) {
              zapStreamLogger.error(
                "Invalid SSE event data - validation failed",
                {
                  error: parseResult.error.format(),
                  rawData: event.data,
                }
              );
              return; // Skip invalid events
            }

            const rawData = parseResult.data;

            const normalizeProgress = (value: unknown, fallback = 0) => {
              if (typeof value !== "number" || Number.isNaN(value)) {
                return fallback;
              }

              if (value > 1) {
                return Math.min(value / 100, 1);
              }

              if (value < 0) {
                return 0;
              }

              return value;
            };

            const getPhase = (
              data: UnifiedZapRawEvent
            ): UnifiedZapPhase | null => {
              const candidates = [
                data?.phase,
                data?.currentStep,
                data?.currentOperation,
                data?.metadata?.phase,
                data?.type,
              ]
                .map(candidate => {
                  if (
                    typeof candidate === "string" ||
                    typeof candidate === "number"
                  ) {
                    return candidate.toString().toLowerCase();
                  }
                  return null;
                })
                .filter((value): value is string => value !== null);

              for (const candidate of candidates) {
                if (
                  (UNIFIED_ZAP_PHASES as readonly string[]).includes(candidate)
                ) {
                  return candidate as UnifiedZapPhase;
                }
              }

              if (data?.type === "complete") {
                return "complete";
              }

              if (data?.type === "error") {
                return "error";
              }

              return null;
            };

            const resolvedPhase = getPhase(rawData);

            const progressValue =
              typeof rawData.progress === "number"
                ? rawData.progress
                : typeof rawData.progressPercent === "number"
                  ? rawData.progressPercent / 100
                  : 0;

            const normalizeTransactions = (
              input: unknown
            ): UnifiedZapStreamTransaction[] | undefined => {
              if (!Array.isArray(input)) {
                return undefined;
              }

              const mapped = input
                .map(item => {
                  if (!item || typeof item !== "object") {
                    return null;
                  }

                  // Type-safe access to transaction fields
                  const txRecord = item as Record<string, unknown>;
                  const to = safeString(txRecord["to"]);
                  const data = safeString(txRecord["data"]);

                  if (!to || !data) {
                    return null;
                  }

                  const chainId = safeNumber(txRecord["chainId"]);
                  const valueStr = safeHexishString(txRecord["value"]);
                  const gasStr =
                    safeHexishString(txRecord["gas"]) ??
                    safeHexishString(txRecord["gasLimit"]);
                  const gasPriceStr = safeHexishString(txRecord["gasPrice"]);
                  const maxFeePerGas = safeHexishString(
                    txRecord["maxFeePerGas"]
                  );
                  const maxPriorityFeePerGas = safeHexishString(
                    txRecord["maxPriorityFeePerGas"]
                  );

                  const normalizedTx: UnifiedZapStreamTransaction = {
                    to,
                    data,
                  };

                  if (valueStr) {
                    normalizedTx.value = valueStr;
                  }

                  if (gasStr) {
                    normalizedTx.gas = gasStr;
                  }

                  if (gasPriceStr) {
                    normalizedTx.gasPrice = gasPriceStr;
                  }

                  if (maxFeePerGas) {
                    normalizedTx.maxFeePerGas = maxFeePerGas;
                  }

                  if (maxPriorityFeePerGas) {
                    normalizedTx.maxPriorityFeePerGas = maxPriorityFeePerGas;
                  }

                  if (chainId !== undefined) {
                    normalizedTx.chainId = chainId;
                  }

                  return normalizedTx;
                })
                .filter((tx): tx is UnifiedZapStreamTransaction => tx !== null);

              return mapped.length > 0 ? mapped : undefined;
            };

            const metadata = rawData.metadata ?? undefined;
            const metadataMessage =
              safeString(metadata?.message) ??
              safeString(metadata?.description) ??
              safeString(rawData.description) ??
              safeString(rawData.message) ??
              safeString(rawData.additionalData?.message) ??
              safeString(rawData.additionalInfo?.message);

            const chainBreakdownSource =
              metadata?.chainBreakdown ??
              rawData.chainBreakdown ??
              rawData.chains;

            const normalizedChainBreakdown = Array.isArray(chainBreakdownSource)
              ? chainBreakdownSource
                  .map(entry => {
                    if (!entry || typeof entry !== "object") {
                      return null;
                    }

                    // Type-safe access to chain breakdown fields
                    const entryRecord = entry as Record<string, unknown>;
                    const name = safeString(entryRecord["name"]);
                    const chainId = safeNumber(entryRecord["chainId"]);
                    const protocolCount = safeNumber(
                      entryRecord["protocolCount"]
                    );

                    if (
                      name &&
                      chainId !== undefined &&
                      protocolCount !== undefined
                    ) {
                      return { name, chainId, protocolCount } as const;
                    }

                    return null;
                  })
                  .filter(
                    (
                      entry
                    ): entry is {
                      name: string;
                      chainId: number;
                      protocolCount: number;
                    } => entry !== null
                  )
              : undefined;

            const normalizedMetadata: Partial<NormalizedZapEvent["metadata"]> =
              {};

            const totalStrategies =
              safeNumber(metadata?.totalStrategies) ??
              safeNumber(rawData.totalStrategies) ??
              safeNumber(rawData.strategyCount);
            const totalProtocols =
              safeNumber(metadata?.totalProtocols) ??
              safeNumber(rawData.totalProtocols) ??
              safeNumber(rawData.protocolCount);
            const estimatedDuration =
              safeString(metadata?.estimatedDuration) ??
              safeString(rawData.estimatedDuration);
            const processedStrategies =
              safeNumber(metadata?.processedStrategies) ??
              safeNumber(rawData.processedStrategies);
            const processedProtocols =
              safeNumber(metadata?.processedProtocols) ??
              safeNumber(rawData.processedProtocols);
            const metadataProgressPercent =
              safeNumber(metadata?.progressPercent) ??
              safeNumber(rawData.progressPercent);

            if (totalStrategies !== undefined) {
              normalizedMetadata.totalStrategies = totalStrategies;
            }
            if (totalProtocols !== undefined) {
              normalizedMetadata.totalProtocols = totalProtocols;
            }
            if (estimatedDuration) {
              normalizedMetadata.estimatedDuration = estimatedDuration;
            }
            if (processedStrategies !== undefined) {
              normalizedMetadata.processedStrategies = processedStrategies;
            }
            if (processedProtocols !== undefined) {
              normalizedMetadata.processedProtocols = processedProtocols;
            }
            if (
              normalizedChainBreakdown &&
              normalizedChainBreakdown.length > 0
            ) {
              normalizedMetadata.chainBreakdown = normalizedChainBreakdown;
            }
            if (metadataMessage) {
              normalizedMetadata.message = metadataMessage;
            }
            if (metadataProgressPercent !== undefined) {
              normalizedMetadata.progressPercent = metadataProgressPercent;
            }

            // Access transactions from raw data (already validated by Zod)
            const rawDataRecord = rawData as Record<string, unknown>;
            const normalizedTransactions =
              normalizeTransactions(rawDataRecord["transactions"]) ??
              normalizeTransactions(metadata?.transactions);

            const normalizedChainId =
              safeNumber(rawDataRecord["chainId"]) ??
              safeNumber(metadata?.chainId);

            const normalizedEvent: UnifiedZapStreamEvent = {
              type: safeString(rawData.type) ?? "progress",
              intentId,
              progress:
                rawData.type === "complete"
                  ? 1
                  : normalizeProgress(progressValue, 0),
              currentStep: resolvedPhase,
              timestamp:
                safeString(rawData.timestamp) ??
                safeString(rawData.rawTimestamp) ??
                new Date().toISOString(),
              rawEvent: rawData,
            };

            const normalizedPhase =
              safeString(rawData.phase) ??
              safeString(metadata?.phase) ??
              safeString(rawData.currentOperation);

            if (normalizedPhase) {
              normalizedEvent.phase = normalizedPhase;
            }

            const normalizedOperation = safeString(rawData.currentOperation);
            if (normalizedOperation) {
              normalizedEvent.currentOperation = normalizedOperation;
            }

            const normalizedProgressPercent = safeNumber(
              rawData.progressPercent
            );
            if (normalizedProgressPercent !== undefined) {
              normalizedEvent.progressPercent = normalizedProgressPercent;
            }

            const normalizedProcessedTokens = safeNumber(
              rawData.processedTokens
            );
            if (normalizedProcessedTokens !== undefined) {
              normalizedEvent.processedTokens = normalizedProcessedTokens;
            }

            const normalizedTotalTokens = safeNumber(rawData.totalTokens);
            if (normalizedTotalTokens !== undefined) {
              normalizedEvent.totalTokens = normalizedTotalTokens;
            }

            if (metadataMessage) {
              normalizedEvent.message = metadataMessage;
            }

            if (Object.keys(normalizedMetadata).length > 0) {
              normalizedEvent.metadata = normalizedMetadata;
            }

            let transactionsWithChain:
              | UnifiedZapStreamTransaction[]
              | undefined;

            if (normalizedTransactions) {
              transactionsWithChain = normalizedTransactions.map(tx => {
                if (tx.chainId !== undefined) {
                  return tx;
                }

                if (normalizedChainId !== undefined) {
                  return { ...tx, chainId: normalizedChainId };
                }

                return tx;
              });

              if (transactionsWithChain.length > 0) {
                normalizedEvent.transactions = transactionsWithChain;
              }
            }

            const resolvedChainId =
              normalizedChainId ??
              transactionsWithChain?.find(tx => tx.chainId !== undefined)
                ?.chainId;

            if (typeof resolvedChainId === "number") {
              normalizedEvent.chainId = resolvedChainId;
            }

            const normalizedError = rawData.error
              ? typeof rawData.error === "string"
                ? {
                    code: safeString(rawData.errorCode) ?? "STREAM_ERROR",
                    message: rawData.error,
                    details: rawData,
                  }
                : {
                    code:
                      safeString(rawData.error?.code) ??
                      safeString(rawData.errorCode) ??
                      "STREAM_ERROR",
                    message:
                      safeString(rawData.error?.message) ??
                      "Stream reported an error",
                    details: rawData.error?.details ?? rawData,
                  }
              : null;

            if (normalizedError) {
              normalizedEvent.error = normalizedError;
            }

            zapStreamLogger.debug("Received SSE event", normalizedEvent);

            setEvents(prev => [...prev, normalizedEvent]);

            if (
              normalizedEvent.type === "error" &&
              normalizedEvent.error?.message
            ) {
              setError(normalizedEvent.error.message);
            }

            if (
              normalizedEvent.type === "complete" ||
              normalizedEvent.type === "error"
            ) {
              hasTerminalEventRef.current = true;

              setTimeout(() => {
                closeStream();
              }, 5000); // Keep connection open for 5 seconds after completion
            }
          } catch (parseError) {
            zapStreamLogger.error("Failed to parse SSE event", parseError);
            setError("Failed to parse stream event");
          }
        };

        eventSource.onerror = event => {
          if (hasTerminalEventRef.current) {
            zapStreamLogger.info("SSE closed after terminal event", {
              intentId,
              streamUrl,
              readyState: eventSource.readyState,
            });
            closeStream();
            return;
          }

          zapStreamLogger.warn("SSE connection error", {
            event,
            intentId,
            streamUrl,
            readyState: eventSource.readyState,
            reconnectAttempts,
          });
          setIsConnected(false);

          // Attempt reconnection if we haven't exceeded max attempts
          if (
            reconnectAttempts < MAX_RECONNECT_ATTEMPTS &&
            !isComplete &&
            !hasError
          ) {
            zapStreamLogger.info("Attempting reconnection", {
              attempt: reconnectAttempts + 1,
              maxAttempts: MAX_RECONNECT_ATTEMPTS,
            });

            reconnectTimeoutRef.current = setTimeout(() => {
              isReconnectingRef.current = true;
              closeStream();
              setReconnectAttempts(prev => prev + 1);
            }, RECONNECT_DELAY);
          } else {
            setError(
              `Stream connection failed after ${reconnectAttempts} attempts`
            );
            closeStream();
          }
        };
      } catch (connectionError) {
        zapStreamLogger.error(
          "Failed to create SSE connection",
          connectionError
        );
        setError("Failed to establish stream connection");
      }
    },
    [closeStream, reconnectAttempts, isComplete, hasError]
  );

  const reconnect = useCallback(() => {
    if (intentId) {
      setEvents([]); // Clear previous events on manual reconnect
      setError(null);
      hasTerminalEventRef.current = false;
      setReconnectAttempts(0);
      connectToStream(intentId);
    }
  }, [intentId, connectToStream]);

  // Effect to manage stream connection
  useEffect(() => {
    if (
      intentId &&
      enabled &&
      !isComplete &&
      !hasError &&
      !hasTerminalEventRef.current
    ) {
      // Avoid opening duplicate connections when a reconnect is already in flight
      if (!eventSourceRef.current) {
        connectToStream(intentId);
      }
    } else if (!enabled) {
      closeStream();
    }

    // Reset reconnect guard after the new effect cycle completes
    if (isReconnectingRef.current) {
      isReconnectingRef.current = false;
    }

    // Cleanup on unmount or when intentId changes
    return () => {
      if (!isReconnectingRef.current && !hasTerminalEventRef.current) {
        closeStream();
      }
    };
  }, [intentId, enabled, isComplete, hasError, connectToStream, closeStream]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    events,
    latestEvent,
    isConnected,
    isComplete,
    hasError,
    progress,
    currentStep,
    error,
    closeStream,
    reconnect,
    transactions,
  };
}

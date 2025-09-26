/**
 * useUnifiedZapStream Hook
 * Manages Server-Sent Events (SSE) streaming for UnifiedZap intent execution
 * Provides real-time progress updates and error handling
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS } from "../lib/http-utils";
import { logger } from "../utils/logger";

const zapStreamLogger = logger.createContextLogger("UnifiedZapStream");

export interface UnifiedZapStreamEvent {
  type:
    | "connected"
    | "strategy_parsing"
    | "token_analysis"
    | "swap_preparation"
    | "transaction_building"
    | "gas_estimation"
    | "final_assembly"
    | "complete"
    | "error";
  intentId: string;
  progress: number; // 0-1
  currentStep?: string;
  metadata?: {
    totalStrategies?: number;
    totalProtocols?: number;
    estimatedDuration?: string;
    processedStrategies?: number;
    processedProtocols?: number;
    chainBreakdown?: Array<{
      name: string;
      chainId: number;
      protocolCount: number;
    }>;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface UseUnifiedZapStreamReturn {
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
}

/**
 * Custom hook for managing UnifiedZap SSE streaming
 * @param intentId - The intent ID to stream progress for
 * @param enabled - Whether to enable streaming (default: true when intentId is provided)
 */
export function useUnifiedZapStream(
  intentId: string | null,
  enabled: boolean = true
): UseUnifiedZapStreamReturn {
  const [events, setEvents] = useState<UnifiedZapStreamEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Derived state
  const latestEvent = events.length > 0 ? events[events.length - 1]! : null;
  const isComplete = latestEvent?.type === "complete";
  const hasError = latestEvent?.type === "error" || error !== null;
  const progress = latestEvent?.progress ?? 0;
  const currentStep = latestEvent?.currentStep ?? null;

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

      try {
        // Construct stream URL using the configured intent engine endpoint
        const sanitizedBaseUrl = API_ENDPOINTS.intentEngine.replace(/\/$/, "");
        const streamPath = `/api/unifiedzap/${intentId}/stream`;
        const streamUrl = sanitizedBaseUrl
          ? `${sanitizedBaseUrl}${streamPath}`
          : streamPath;

        const eventSource = new EventSource(streamUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          zapStreamLogger.info("SSE connected", { intentId });
          setIsConnected(true);
          setError(null);
          setReconnectAttempts(0);
        };

        eventSource.onmessage = event => {
          try {
            const data: UnifiedZapStreamEvent = JSON.parse(event.data);

            zapStreamLogger.debug("Received SSE event", data);

            setEvents(prev => [...prev, data]);

            // Auto-close on completion or error
            if (data.type === "complete" || data.type === "error") {
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
          zapStreamLogger.warn("SSE connection error", event);
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
              setReconnectAttempts(prev => prev + 1);
              connectToStream(intentId);
            }, RECONNECT_DELAY);
          } else {
            setError("Stream connection failed");
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
      setReconnectAttempts(0);
      connectToStream(intentId);
    }
  }, [intentId, connectToStream]);

  // Effect to manage stream connection
  useEffect(() => {
    if (intentId && enabled && !isComplete) {
      connectToStream(intentId);
    } else if (!enabled || isComplete) {
      closeStream();
    }

    // Cleanup on unmount or when intentId changes
    return () => {
      closeStream();
    };
  }, [intentId, enabled, isComplete, connectToStream, closeStream]);

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
  };
}

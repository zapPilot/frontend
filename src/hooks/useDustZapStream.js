import { useCallback, useEffect, useRef, useState } from "react";

export const useDustZapStream = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [processedTokens, setProcessedTokens] = useState(0);
  const [batchesCompleted, setBatchesCompleted] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const eventSourceRef = useRef(null);
  const intentIdRef = useRef(null);
  const isCompleteRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const lastEventIdRef = useRef(null);
  const maxReconnectAttempts = 5;

  const startStreaming = useCallback(
    async intentId => {
      if (isStreaming) {
        console.warn("Already streaming, ignoring new request");
        return;
      }

      try {
        setIsStreaming(true);
        setError(null);
        setEvents([]);
        setIsConnected(false);
        setIsComplete(false);
        setProcessedTokens(0);
        setBatchesCompleted(0);
        setTotalTokens(0);

        intentIdRef.current = intentId;
        isCompleteRef.current = false;

        // Only reset reconnect attempts and lastEventId for completely new streams
        if (!lastEventIdRef.current) {
          reconnectAttemptsRef.current = 0;
        }

        // Create SSE connection with optional Last-Event-ID for resumption
        const streamUrl = `${process.env.NEXT_PUBLIC_INTENT_ENGINE_URL}/api/dustzap/${intentId}/stream`;
        const eventSource = lastEventIdRef.current
          ? new EventSource(
              `${streamUrl}?lastEventId=${lastEventIdRef.current}`
            )
          : new EventSource(streamUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log("SSE connection opened");
          setIsConnected(true);
        };

        eventSource.onmessage = event => {
          try {
            // Track last event ID for resumable connections
            if (event.lastEventId) {
              lastEventIdRef.current = event.lastEventId;
            }

            const data = JSON.parse(event.data);
            console.log("SSE event received:", data);

            setEvents(prev => [...prev, data]);

            switch (data.type) {
              case "connected":
                setTotalTokens(data.totalTokens || 0);
                break;

              case "token_ready":
                setProcessedTokens(data.processedTokens || 0);
                break;

              case "token_failed":
                setProcessedTokens(data.processedTokens || 0);
                // Could also show failed token info if needed
                break;

              case "complete":
                console.log("🏁 SSE Complete Event Received:", {
                  eventData: data,
                  hasTransactions: !!data.transactions,
                  transactionCount: data.transactions?.length || 0,
                  timestamp: new Date().toISOString(),
                });
                setIsComplete(true);
                isCompleteRef.current = true;
                setIsStreaming(false);
                // Don't close connection immediately, let cleanup handle it
                break;

              case "stream_complete":
                setIsComplete(true);
                isCompleteRef.current = true;
                setIsStreaming(false);
                // Graceful completion - don't treat as error
                break;

              case "error":
                setError(data.error || "Unknown streaming error");
                setIsStreaming(false);
                break;

              default:
                console.log("Unknown event type:", data.type);
            }
          } catch (parseError) {
            console.error("Error parsing SSE message:", parseError);
            setError("Failed to parse streaming data");
          }
        };

        eventSource.onerror = error => {
          console.error("SSE error:", error);

          // Only treat as error if not completed normally (use ref for current state)
          if (!isCompleteRef.current) {
            setError("Connection error occurred");
            setIsStreaming(false);
            setIsConnected(false);

            // Implement exponential backoff for reconnection
            if (
              eventSource.readyState === EventSource.CLOSED &&
              !isCompleteRef.current &&
              reconnectAttemptsRef.current < maxReconnectAttempts
            ) {
              const backoffDelay = Math.min(
                1000 * Math.pow(2, reconnectAttemptsRef.current),
                30000
              );
              reconnectAttemptsRef.current += 1;

              console.log(
                `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${backoffDelay}ms...`
              );

              setTimeout(() => {
                if (intentIdRef.current && !isCompleteRef.current) {
                  startStreaming(intentIdRef.current);
                }
              }, backoffDelay);
            } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
              console.error("Max reconnection attempts reached, giving up");
              setError("Connection failed after multiple attempts");
            }
          } else {
            // Stream completed normally, just clean up
            console.log("SSE connection closed after completion");
            setIsStreaming(false);
            setIsConnected(false);
          }
        };
      } catch (error) {
        console.error("Error starting stream:", error);
        setError(`Failed to start streaming: ${error.message}`);
        setIsStreaming(false);
      }
    },
    [isStreaming]
  );

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    setIsConnected(false);
    intentIdRef.current = null;
    isCompleteRef.current = false;
    reconnectAttemptsRef.current = 0;
    lastEventIdRef.current = null;
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setError(null);
    setProcessedTokens(0);
    setBatchesCompleted(0);
    setTotalTokens(0);
    setIsComplete(false);
    isCompleteRef.current = false;
    reconnectAttemptsRef.current = 0;
    lastEventIdRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  // Calculate progress percentage
  const progress =
    totalTokens > 0 ? Math.min(100, (processedTokens / totalTokens) * 100) : 0;

  return {
    // Connection state
    isConnected,
    isStreaming,
    isComplete,
    error,

    // Progress data
    events,
    totalTokens,
    processedTokens,
    batchesCompleted,
    progress,

    // Actions
    startStreaming,
    stopStreaming,
    clearEvents,
  };
};

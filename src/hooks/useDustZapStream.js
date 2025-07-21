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

        // Create SSE connection
        const eventSource = new EventSource(
          `${process.env.NEXT_PUBLIC_INTENT_ENGINE_URL}/api/dustzap/${intentId}/stream`
        );
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log("SSE connection opened");
          setIsConnected(true);
        };

        eventSource.onmessage = event => {
          try {
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
                setIsComplete(true);
                setIsStreaming(false);
                // Don't close connection immediately, let cleanup handle it
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
          setError("Connection error occurred");
          setIsStreaming(false);
          setIsConnected(false);

          // Try to reconnect if not intentionally closed
          if (eventSource.readyState === EventSource.CLOSED && !isComplete) {
            console.log("Attempting to reconnect...");
            setTimeout(() => {
              if (intentIdRef.current) {
                startStreaming(intentIdRef.current);
              }
            }, 2000);
          }
        };
      } catch (error) {
        console.error("Error starting stream:", error);
        setError(`Failed to start streaming: ${error.message}`);
        setIsStreaming(false);
      }
    },
    [isStreaming, isComplete]
  );

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    setIsConnected(false);
    intentIdRef.current = null;
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setError(null);
    setProcessedTokens(0);
    setBatchesCompleted(0);
    setTotalTokens(0);
    setIsComplete(false);
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

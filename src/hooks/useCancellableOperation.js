import { useCallback, useRef, useState } from "react";

/**
 * Hook for managing cancellable operations with timeout support
 */
export const useCancellableOperation = () => {
  const [isOperationActive, setIsOperationActive] = useState(false);
  const [operationProgress, setOperationProgress] = useState({
    current: 0,
    total: 0,
  });
  const [operationStatus, setOperationStatus] = useState(null); // 'running' | 'cancelling' | 'cancelled' | 'completed' | 'error'

  const cancellationTokenRef = useRef(null);
  const timeoutRef = useRef(null);
  const currentOperationRef = useRef(null);

  /**
   * Create a new cancellation token
   */
  const createCancellationToken = useCallback(() => {
    const token = {
      isCancelled: false,
      reason: null,
      callbacks: new Set(),

      // Method to cancel the operation
      cancel: (reason = "Operation cancelled by user") => {
        if (!token.isCancelled) {
          token.isCancelled = true;
          token.reason = reason;

          // Notify all registered callbacks
          token.callbacks.forEach(callback => {
            try {
              callback(reason);
            } catch (error) {
              console.error("Error in cancellation callback:", error);
            }
          });
        }
      },

      // Method to register cancellation callbacks
      onCancel: callback => {
        if (typeof callback === "function") {
          token.callbacks.add(callback);
        }

        // Return cleanup function
        return () => token.callbacks.delete(callback);
      },

      // Method to check if operation should continue
      throwIfCancelled: () => {
        if (token.isCancelled) {
          throw new Error(`Operation cancelled: ${token.reason}`);
        }
      },
    };

    return token;
  }, []);

  /**
   * Start a cancellable operation
   */
  const startOperation = useCallback(
    (operationName, totalSteps = 1, timeoutMs = 300000) => {
      // Cancel any existing operation
      if (cancellationTokenRef.current) {
        cancellationTokenRef.current.cancel("New operation started");
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Create new cancellation token
      const token = createCancellationToken();
      cancellationTokenRef.current = token;
      currentOperationRef.current = operationName;

      // Set initial state
      setIsOperationActive(true);
      setOperationStatus("running");
      setOperationProgress({ current: 0, total: totalSteps });

      // Set timeout for operation
      timeoutRef.current = setTimeout(() => {
        if (token && !token.isCancelled) {
          token.cancel(`Operation timeout after ${timeoutMs}ms`);
          setOperationStatus("error");
        }
      }, timeoutMs);

      return token;
    },
    [createCancellationToken]
  );

  /**
   * Update operation progress
   */
  const updateProgress = useCallback((current, total = null, status = null) => {
    setOperationProgress(prev => ({
      current,
      total: total !== null ? total : prev.total,
    }));

    if (status) {
      setOperationStatus(status);
    }
  }, []);

  /**
   * Cancel the current operation
   */
  const cancelOperation = useCallback(
    (reason = "Operation cancelled by user") => {
      if (
        cancellationTokenRef.current &&
        !cancellationTokenRef.current.isCancelled
      ) {
        setOperationStatus("cancelling");

        // Give a small delay to show "cancelling" state
        setTimeout(() => {
          cancellationTokenRef.current.cancel(reason);
          setOperationStatus("cancelled");
          setIsOperationActive(false);
        }, 500);
      }
    },
    []
  );

  /**
   * Complete the current operation
   */
  const completeOperation = useCallback((result = null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setOperationStatus("completed");
    setIsOperationActive(false);
    setOperationProgress(prev => ({ ...prev, current: prev.total }));

    cancellationTokenRef.current = null;
    currentOperationRef.current = null;

    return result;
  }, []);

  /**
   * Handle operation error
   */
  const errorOperation = useCallback(error => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setOperationStatus("error");
    setIsOperationActive(false);

    cancellationTokenRef.current = null;
    currentOperationRef.current = null;

    throw error;
  }, []);

  /**
   * Reset operation state
   */
  const resetOperation = useCallback(() => {
    if (cancellationTokenRef.current) {
      cancellationTokenRef.current.cancel("Operation reset");
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsOperationActive(false);
    setOperationStatus(null);
    setOperationProgress({ current: 0, total: 0 });

    cancellationTokenRef.current = null;
    currentOperationRef.current = null;
  }, []);

  /**
   * Create a cancellable promise wrapper
   */
  const makeCancellable = useCallback((promise, token = null) => {
    const activeToken = token || cancellationTokenRef.current;

    if (!activeToken) {
      throw new Error(
        "No cancellation token available. Call startOperation first."
      );
    }

    return new Promise((resolve, reject) => {
      // Handle cancellation
      const cleanup = activeToken.onCancel(reason => {
        reject(new Error(`Operation cancelled: ${reason}`));
      });

      // Handle promise resolution
      promise
        .then(result => {
          cleanup();
          if (!activeToken.isCancelled) {
            resolve(result);
          }
        })
        .catch(error => {
          cleanup();
          if (!activeToken.isCancelled) {
            reject(error);
          }
        });
    });
  }, []);

  /**
   * Create a delay that can be cancelled
   */
  const cancellableDelay = useCallback((ms, token = null) => {
    const activeToken = token || cancellationTokenRef.current;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!activeToken?.isCancelled) {
          resolve();
        }
      }, ms);

      // Handle cancellation
      if (activeToken) {
        const cleanup = activeToken.onCancel(reason => {
          clearTimeout(timeout);
          reject(new Error(`Delay cancelled: ${reason}`));
        });

        // Cleanup on completion
        setTimeout(() => cleanup(), ms + 10);
      }
    });
  }, []);

  /**
   * Get current operation info
   */
  const getOperationInfo = useCallback(() => {
    return {
      isActive: isOperationActive,
      status: operationStatus,
      progress: operationProgress,
      operationName: currentOperationRef.current,
      canCancel: isOperationActive && operationStatus === "running",
      progressPercentage:
        operationProgress.total > 0
          ? (operationProgress.current / operationProgress.total) * 100
          : 0,
    };
  }, [isOperationActive, operationStatus, operationProgress]);

  return {
    // State
    isOperationActive,
    operationStatus,
    operationProgress,

    // Core functions
    startOperation,
    cancelOperation,
    completeOperation,
    errorOperation,
    resetOperation,
    updateProgress,

    // Utility functions
    makeCancellable,
    cancellableDelay,
    createCancellationToken,
    getOperationInfo,

    // Current token reference (for advanced usage)
    getCurrentToken: () => cancellationTokenRef.current,
  };
};

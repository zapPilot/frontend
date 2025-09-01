import { useCallback, useRef, useState } from "react";

interface OperationProgress {
  current: number;
  total: number;
}

type OperationStatus =
  | "running"
  | "cancelling"
  | "cancelled"
  | "completed"
  | "error"
  | null;

interface CancellationToken {
  isCancelled: boolean;
  reason: string | null;
  cancel: (reason?: string) => void;
  throwIfCancelled: () => void;
}

interface OperationInfo {
  isActive: boolean;
  status: OperationStatus;
  progress: OperationProgress;
  operationName: string | null;
  canCancel: boolean;
  progressPercentage: number;
}

interface UseCancellableOperationReturn {
  // State
  isOperationActive: boolean;
  operationStatus: OperationStatus;
  operationProgress: OperationProgress;

  // Core functions
  startOperation: (
    operationName: string,
    totalSteps?: number,
    timeoutMs?: number
  ) => CancellationToken;
  cancelOperation: (reason?: string) => void;
  completeOperation: <T = unknown>(result?: T) => T | undefined;
  errorOperation: (error: Error) => never;
  resetOperation: () => void;
  updateProgress: (
    current: number,
    total?: number | null,
    status?: OperationStatus | null
  ) => void;

  // Utility functions
  makeCancellable: <T>(
    promise: Promise<T>,
    token?: CancellationToken | null
  ) => Promise<T>;
  cancellableDelay: (
    ms: number,
    token?: CancellationToken | null
  ) => Promise<void>;
  getOperationInfo: () => OperationInfo;
}

/**
 * Hook for managing cancellable operations with timeout support
 * Simplified from the original over-engineered version
 */
export const useCancellableOperation = (): UseCancellableOperationReturn => {
  const [isOperationActive, setIsOperationActive] = useState(false);
  const [operationProgress, setOperationProgress] = useState<OperationProgress>(
    {
      current: 0,
      total: 0,
    }
  );
  const [operationStatus, setOperationStatus] = useState<OperationStatus>(null);

  const currentTokenRef = useRef<CancellationToken | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentOperationRef = useRef<string | null>(null);

  const createCancellationToken = useCallback((): CancellationToken => {
    const token: CancellationToken = {
      isCancelled: false,
      reason: null,

      cancel: (reason = "Operation cancelled by user") => {
        if (!token.isCancelled) {
          token.isCancelled = true;
          token.reason = reason;
        }
      },

      throwIfCancelled: () => {
        if (token.isCancelled) {
          throw new Error(`Operation cancelled: ${token.reason}`);
        }
      },
    };

    return token;
  }, []);

  const startOperation = useCallback(
    (
      operationName: string,
      totalSteps = 1,
      timeoutMs = 300000
    ): CancellationToken => {
      // Cancel any existing operation
      if (currentTokenRef.current) {
        currentTokenRef.current.cancel("New operation started");
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Create new cancellation token
      const token = createCancellationToken();
      currentTokenRef.current = token;
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
          setIsOperationActive(false);
        }
      }, timeoutMs);

      return token;
    },
    [createCancellationToken]
  );

  const updateProgress = useCallback(
    (
      current: number,
      total: number | null = null,
      status: OperationStatus | null = null
    ) => {
      setOperationProgress(prev => ({
        current,
        total: total !== null ? total : prev.total,
      }));

      if (status) {
        setOperationStatus(status);
      }
    },
    []
  );

  const cancelOperation = useCallback(
    (reason = "Operation cancelled by user") => {
      if (currentTokenRef.current && !currentTokenRef.current.isCancelled) {
        setOperationStatus("cancelling");

        // Give a small delay to show "cancelling" state
        setTimeout(() => {
          currentTokenRef.current?.cancel(reason);
          setOperationStatus("cancelled");
          setIsOperationActive(false);
        }, 500);
      }
    },
    []
  );

  const completeOperation = useCallback(
    <T = unknown>(result?: T): T | undefined => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setOperationStatus("completed");
      setIsOperationActive(false);
      setOperationProgress(prev => ({ ...prev, current: prev.total }));

      currentTokenRef.current = null;
      currentOperationRef.current = null;

      return result;
    },
    []
  );

  const errorOperation = useCallback((error: Error): never => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setOperationStatus("error");
    setIsOperationActive(false);

    currentTokenRef.current = null;
    currentOperationRef.current = null;

    throw error;
  }, []);

  const resetOperation = useCallback(() => {
    if (currentTokenRef.current) {
      currentTokenRef.current.cancel("Operation reset");
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsOperationActive(false);
    setOperationStatus(null);
    setOperationProgress({ current: 0, total: 0 });

    currentTokenRef.current = null;
    currentOperationRef.current = null;
  }, []);

  const makeCancellable = useCallback(
    <T>(
      promise: Promise<T>,
      token: CancellationToken | null = null
    ): Promise<T> => {
      const activeToken = token || currentTokenRef.current;

      if (!activeToken) {
        throw new Error(
          "No cancellation token available. Call startOperation first."
        );
      }

      return new Promise<T>((resolve, reject) => {
        // Handle promise resolution
        promise
          .then(result => {
            if (!activeToken.isCancelled) {
              resolve(result);
            } else {
              reject(new Error(`Operation cancelled: ${activeToken.reason}`));
            }
          })
          .catch(error => {
            if (!activeToken.isCancelled) {
              reject(error);
            }
          });
      });
    },
    []
  );

  const cancellableDelay = useCallback(
    (ms: number, token: CancellationToken | null = null): Promise<void> => {
      const activeToken = token || currentTokenRef.current;

      return new Promise<void>((resolve, reject) => {
        if (activeToken?.isCancelled) {
          reject(new Error(`Delay cancelled: ${activeToken.reason}`));
          return;
        }

        const timeout = setTimeout(() => {
          if (!activeToken?.isCancelled) {
            resolve();
          } else {
            reject(new Error(`Delay cancelled: ${activeToken.reason}`));
          }
        }, ms);

        // Cleanup timeout if operation gets cancelled
        if (activeToken) {
          const originalCancel = activeToken.cancel;
          activeToken.cancel = (reason = "Operation cancelled") => {
            clearTimeout(timeout);
            originalCancel(reason);
            reject(new Error(`Delay cancelled: ${reason}`));
          };
        }
      });
    },
    []
  );

  const getOperationInfo = useCallback((): OperationInfo => {
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
    getOperationInfo,
  };
};

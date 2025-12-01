import { type Dispatch, type SetStateAction, useCallback } from "react";

/**
 * Operation State Utilities
 *
 * Utilities for managing operation states (loading, error) in hooks.
 * Reduces duplication in mutation handlers.
 */

export interface OperationState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Creates a standardized error handler for operation state setters
 */
export function createOperationStateHandler(
  setState: Dispatch<SetStateAction<OperationState>>
) {
  return {
    /** Set loading state */
    setLoading: () => setState({ isLoading: true, error: null }),

    /** Set success state */
    setSuccess: () => setState({ isLoading: false, error: null }),

    /** Set error state */
    setError: (error: string) => setState({ isLoading: false, error }),
  };
}

/**
 * Hook for managing operation state with standardized handlers
 */
export function useOperationStateHandlers(
  setState: Dispatch<SetStateAction<OperationState>>
) {
  const setLoading = useCallback(
    () => setState({ isLoading: true, error: null }),
    [setState]
  );

  const setSuccess = useCallback(
    () => setState({ isLoading: false, error: null }),
    [setState]
  );

  const setError = useCallback(
    (error: string) => setState({ isLoading: false, error }),
    [setState]
  );

  return { setLoading, setSuccess, setError };
}

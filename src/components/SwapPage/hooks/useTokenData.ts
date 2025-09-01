import { useCallback, useRef, useState } from "react";
import { transformToDebankChainName } from "../../../utils/chainHelper";
import { getTokens } from "../../../utils/dustConversion";
import { DustToken } from "../../../types/optimize";

interface TokenDataState {
  data: DustToken[];
  status: "idle" | "loading" | "error";
  error: string | null;
}

interface UseTokenDataReturn {
  tokens: DustToken[];
  isLoading: boolean;
  error: string | null;
  fetchTokens: (chainName: string, userAddress: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

interface ToastConfig {
  type: string;
  title: string;
  message: string;
  duration?: number;
}

/**
 * Hook for managing token data fetching and state
 * Simplified from the original over-complex useTokenState hook
 */
export function useTokenData(
  showToast?: (toast: ToastConfig) => void
): UseTokenDataReturn {
  const [state, setState] = useState<TokenDataState>({
    data: [],
    status: "idle",
    error: null,
  });

  // Track current request to prevent race conditions
  const currentRequestRef = useRef<{
    userAddress: string;
    chainName: string;
    abortController: AbortController;
  } | null>(null);

  const fetchTokens = useCallback(
    async (chainName: string, userAddress: string) => {
      if (!chainName || !userAddress) return;

      // Check if we already have a request for this wallet+chain combination
      const currentRequest = currentRequestRef.current;
      if (
        currentRequest &&
        currentRequest.userAddress === userAddress &&
        currentRequest.chainName === chainName
      ) {
        return; // Request already in progress
      }

      // Cancel any existing request
      if (currentRequest) {
        currentRequest.abortController.abort();
      }

      // Create new AbortController for this request
      const abortController = new AbortController();

      // Track this request
      currentRequestRef.current = {
        userAddress,
        chainName,
        abortController,
      };

      setState(prev => ({ ...prev, status: "loading", error: null }));

      try {
        const debankChainName = transformToDebankChainName(
          chainName.toLowerCase()
        );
        const tokens = await getTokens(debankChainName, userAddress);

        // Check if request was aborted during fetch
        if (abortController.signal.aborted) {
          return;
        }

        setState(prev => ({ ...prev, data: tokens, status: "idle" }));
      } catch (error) {
        // Don't update state if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        // Show user-friendly error notification
        if (showToast) {
          showToast({
            type: "error",
            title: "Failed to Load Tokens",
            message:
              "Unable to fetch token list. Please reconnect your wallet.",
            duration: 6000,
          });
        }

        setState(prev => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          data: [],
        }));
      } finally {
        // Only clear loading state if this is still the current request
        if (
          currentRequestRef.current?.userAddress === userAddress &&
          currentRequestRef.current?.chainName === chainName
        ) {
          currentRequestRef.current = null;
        }
      }
    },
    [showToast]
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, status: "idle" }));
  }, []);

  const reset = useCallback(() => {
    // Cancel any pending requests
    if (currentRequestRef.current) {
      currentRequestRef.current.abortController.abort();
      currentRequestRef.current = null;
    }

    setState({
      data: [],
      status: "idle",
      error: null,
    });
  }, []);

  return {
    tokens: state.data,
    isLoading: state.status === "loading",
    error: state.error,
    fetchTokens,
    clearError,
    reset,
  };
}

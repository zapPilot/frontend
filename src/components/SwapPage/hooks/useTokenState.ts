import { useCallback, useMemo, useRef, useState } from "react";
import { transformToDebankChainName } from "../../../utils/chainHelper";
import { getTokens } from "../../../utils/dustConversion";
import { DustToken } from "../../../types/optimize";

interface TokenState {
  data: DustToken[];
  status: "idle" | "loading" | "error";
  error: string | null;
  deletedIds: Set<string>;
}

interface UseTokenStateReturn {
  // State
  tokens: DustToken[];
  filteredTokens: DustToken[];
  isLoading: boolean;
  error: string | null;
  deletedIds: Set<string>;

  // Actions
  fetchTokens: (chainName: string, userAddress: string) => Promise<void>;
  deleteToken: (tokenId: string) => void;
  restoreTokens: () => void;
  clearError: () => void;
  reset: () => void;
}

export function useTokenState(
  showToast?: (toast: {
    type: string;
    title: string;
    message: string;
    duration?: number;
  }) => void
): UseTokenStateReturn {
  const [state, setState] = useState<TokenState>({
    data: [],
    status: "idle",
    error: null,
    deletedIds: new Set(),
  });

  // Request state tracking to prevent infinite loops and race conditions
  const currentRequestRef = useRef<{
    userAddress: string;
    chainName: string;
    abortController: AbortController;
  } | null>(null);

  // Performance optimization: Filter tokens using useMemo
  //
  // Previously filtered tokens on every render, which can be expensive for large token lists.
  // Now memoized to only recalculate when token data or deleted IDs change.
  //
  // Impact: Prevents unnecessary filtering operations on every component render
  // Dependencies: state.data (token list), state.deletedIds (deleted token set)
  const filteredTokens = useMemo(
    () => state.data.filter(token => !state.deletedIds.has(token.id)),
    [state.data, state.deletedIds]
  );

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
        return; // Request already in progress, skip
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

        // Show user-friendly error notification if showToast is provided
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

  const deleteToken = useCallback((tokenId: string) => {
    setState(prev => ({
      ...prev,
      deletedIds: new Set([...prev.deletedIds, tokenId]),
    }));
  }, []);

  const restoreTokens = useCallback(() => {
    setState(prev => ({
      ...prev,
      deletedIds: new Set(),
    }));
  }, []);

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
      deletedIds: new Set(),
    });
  }, []);

  return {
    // State
    tokens: state.data,
    filteredTokens,
    isLoading: state.status === "loading",
    error: state.error,
    deletedIds: state.deletedIds,

    // Actions
    fetchTokens,
    deleteToken,
    restoreTokens,
    clearError,
    reset,
  };
}

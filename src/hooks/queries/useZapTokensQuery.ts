import { useQuery } from "@tanstack/react-query";
import { tokenService } from "../../services";

/**
 * Hook to fetch supported zap tokens for a specific chain
 * Uses React Query for caching, loading states, and error handling
 */
export const useZapTokensQuery = (chainId?: number) => {
  return useQuery({
    queryKey: ["zapTokens", chainId],
    queryFn: () => tokenService.getZapTokens(chainId!),
    enabled: !!chainId && chainId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - token lists don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: (failureCount, error) => {
      // Retry up to 2 times, but not on 4xx errors (likely configuration issues)
      if (failureCount >= 2) return false;
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status?: number }).status;
        if (typeof status === "number" && status >= 400 && status < 500) {
          return false;
        }
      }
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * Hook variant that provides additional computed states
 * Useful for components that need more detailed loading/error information
 */
export const useZapTokensWithStates = (chainId?: number) => {
  const query = useZapTokensQuery(chainId);

  return {
    ...query,
    tokens: query.data || [],
    hasTokens: (query.data?.length || 0) > 0,
    isEmpty: query.isSuccess && (query.data?.length || 0) === 0,
    isInitialLoading: query.isLoading && !query.data,
    isRefetching: query.isFetching && !!query.data,
  };
};

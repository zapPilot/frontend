import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { tokenService } from "../../services";
import {
  useTokenBalancesQuery,
  type UseTokenBalancesParams,
} from "./useTokenBalancesQuery";

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
export interface UseZapTokensWithStatesOptions {
  chainId?: number;
  walletAddress?: string | null;
  skipBalanceCache?: boolean;
  balanceEnabled?: boolean;
  tokenAddressesOverride?: string[];
}

export const useZapTokensWithStates = (
  options: UseZapTokensWithStatesOptions = {}
) => {
  const {
    chainId,
    walletAddress,
    skipBalanceCache = false,
    balanceEnabled = true,
    tokenAddressesOverride,
  } = options;

  const query = useZapTokensQuery(chainId);

  const tokens = query.data || [];

  const balanceAddresses = useMemo(() => {
    if (tokenAddressesOverride && tokenAddressesOverride.length > 0) {
      return tokenAddressesOverride;
    }

    return tokens
      .map(token => token.address)
      .filter((address): address is string => typeof address === "string");
  }, [tokenAddressesOverride, tokens]);

  const balanceQueryOptions: UseTokenBalancesParams = {
    tokenAddresses: balanceAddresses,
    skipCache: skipBalanceCache,
    enabled: balanceEnabled,
  };

  if (typeof chainId === "number") {
    balanceQueryOptions.chainId = chainId;
  }

  if (walletAddress !== undefined) {
    balanceQueryOptions.walletAddress = walletAddress;
  }

  const balances = useTokenBalancesQuery(balanceQueryOptions);
  console.log("balances", balances);

  const tokensWithBalances = useMemo(() => {
    if (tokens.length === 0) {
      return tokens;
    }

    const balanceMap = balances.balancesByAddress;

    return tokens.map(token => {
      const tokenAddress = token.address?.toLowerCase();
      if (!tokenAddress) {
        return token;
      }

      const balanceEntry = balanceMap[tokenAddress];
      if (!balanceEntry) {
        return token;
      }

      return {
        ...token,
        balance: balanceEntry.balance,
      };
    });
  }, [tokens, balances.balancesByAddress]);

  return {
    ...query,
    tokens: tokensWithBalances,
    hasTokens: tokensWithBalances.length > 0,
    isEmpty: query.isSuccess && tokensWithBalances.length === 0,
    isInitialLoading: query.isLoading && !query.data,
    isRefetching: query.isFetching && !!query.data,
    isBalanceLoading: balances.isLoading,
    isBalanceFetching: balances.isFetching,
    balanceError: balances.isError ? balances.error : null,
    refetchBalances: balances.refetch,
    balances: balances.balances,
  };
};

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getTokenBalances,
  type NormalizedTokenBalance,
} from "../../services/balanceService";

const BALANCE_STALE_TIME = 3 * 60 * 1000; // 3 minutes – aligns with cache TTL guidance
const BALANCE_GC_TIME = 6 * 60 * 1000; // Retain shortly after stale for smoother UX

export interface UseTokenBalancesParams {
  chainId?: number;
  walletAddress?: string | null;
  tokenAddresses?: string[];
  skipCache?: boolean;
  enabled?: boolean;
}

const normalizeAddresses = (addresses: string[] = []): string[] =>
  Array.from(
    new Set(
      addresses
        .filter(address => typeof address === "string" && address.length > 0)
        .map(address => address.toLowerCase())
    )
  );

export const useTokenBalancesQuery = (params: UseTokenBalancesParams) => {
  const {
    chainId,
    walletAddress,
    tokenAddresses = [],
    skipCache = false,
    enabled = true,
  } = params;

  const normalizedWallet = walletAddress?.toLowerCase() ?? null;
  const normalizedTokens = useMemo(
    () => normalizeAddresses(tokenAddresses),
    [tokenAddresses]
  );

  const queryEnabled = Boolean(
    enabled && chainId && chainId > 0 && normalizedWallet
    // Removed normalizedTokens.length > 0 to allow fetching native balances
  );

  const query = useQuery({
    queryKey: [
      "tokenBalances",
      chainId,
      normalizedWallet,
      normalizedTokens,
      skipCache,
    ],
    queryFn: () =>
      getTokenBalances({
        chainId: chainId!,
        walletAddress: normalizedWallet!,
        tokenAddresses: normalizedTokens,
        skipCache,
      }),
    enabled: queryEnabled,
    staleTime: BALANCE_STALE_TIME,
    gcTime: BALANCE_GC_TIME,
    retry: (failureCount, error) => {
      if (failureCount >= 2) {
        return false;
      }

      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status?: number }).status;
        if (typeof status === "number" && status >= 400 && status < 500) {
          return false;
        }
      }

      return true;
    },
    retryDelay: attemptIndex => Math.min(1500 * 2 ** attemptIndex, 30_000),
  });

  const balancesByAddress = useMemo(() => {
    if (!query.data) {
      return {} as Record<string, NormalizedTokenBalance>;
    }

    return query.data.tokens.reduce<Record<string, NormalizedTokenBalance>>(
      (acc, token) => {
        acc[token.address] = token;
        return acc;
      },
      {}
    );
  }, [query.data]);

  return {
    balances: query.data,
    balancesByAddress,
    tokenCount: normalizedTokens.length,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

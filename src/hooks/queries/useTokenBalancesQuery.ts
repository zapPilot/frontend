import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getTokenBalances,
  type NormalizedTokenBalance,
} from "../../services/balanceService";
import { createQueryConfig } from "./queryDefaults";
import { queryKeys } from "../../lib/queryClient";
import { normalizeAddresses } from "../../lib/stringUtils";

export interface UseTokenBalancesParams {
  chainId?: number;
  walletAddress?: string | null;
  tokenAddresses?: string[];
  skipCache?: boolean;
  enabled?: boolean;
}

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
    ...createQueryConfig({ dataType: "dynamic" }),
    queryKey: queryKeys.balances.list(
      chainId!,
      normalizedWallet!,
      normalizedTokens,
      skipCache
    ),
    queryFn: () =>
      getTokenBalances({
        chainId: chainId!,
        walletAddress: normalizedWallet!,
        tokenAddresses: normalizedTokens,
        skipCache,
      }),
    enabled: queryEnabled,
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

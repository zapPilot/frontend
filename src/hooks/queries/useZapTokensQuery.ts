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

const NATIVE_SENTINEL = "native";

const isHexAddress = (address: string): boolean =>
  /^0x[0-9a-f]{40}$/i.test(address);

const isNativeAddress = (address: string | null | undefined): boolean =>
  !!address && address.toLowerCase() === NATIVE_SENTINEL;

const resolveNativeAddressSentinel = (
  address: string | null | undefined,
  type?: string | null
): string[] => {
  if (
    type === "native" ||
    isNativeAddress(address) ||
    address === "" ||
    address === null ||
    address === undefined
  ) {
    return [NATIVE_SENTINEL];
  }

  return [];
};

const normalizeBalanceLookupKeys = (token: {
  address?: string | null;
  type?: string | null;
}): string[] => {
  const keys: string[] = [];

  const address = token.address?.toLowerCase();
  if (address) {
    keys.push(address);
  }

  const isNativeToken =
    token.type === "native" ||
    address === NATIVE_SENTINEL ||
    address === "" ||
    address === null ||
    address === undefined;

  if (isNativeToken) {
    keys.push(NATIVE_SENTINEL);
  }

  return Array.from(new Set(keys));
};

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

  const tokens = useMemo(() => query.data || [], [query.data]);

  const balanceAddresses = useMemo(() => {
    if (tokenAddressesOverride && tokenAddressesOverride.length > 0) {
      const normalizedOverride = tokenAddressesOverride
        .map(address => address?.toLowerCase())
        .filter((address): address is string => Boolean(address))
        .flatMap(address =>
          isNativeAddress(address) ? [NATIVE_SENTINEL, address] : [address]
        )
        .filter(
          (address): address is string =>
            Boolean(address) &&
            (isHexAddress(address) || address === NATIVE_SENTINEL)
        );

      return Array.from(new Set(normalizedOverride));
    }

    const candidateAddresses = tokens.flatMap(token => {
      const addresses: string[] = [];
      const tokenAddress = token.address?.toLowerCase();

      if (tokenAddress) {
        addresses.push(tokenAddress);
      }

      addresses.push(...resolveNativeAddressSentinel(tokenAddress, token.type));

      return addresses;
    });

    const filtered = candidateAddresses.filter(
      (address): address is string =>
        Boolean(address) &&
        (isHexAddress(address) || address === NATIVE_SENTINEL)
    );

    return Array.from(new Set(filtered));
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

  const tokensWithBalances = useMemo(() => {
    if (tokens.length === 0) {
      return tokens;
    }

    const balanceMap = balances.balancesByAddress;

    return tokens.map(token => {
      const candidateKeys = normalizeBalanceLookupKeys(token);

      const balanceEntry = candidateKeys
        .map(key => balanceMap[key])
        .find(entry => entry !== undefined);

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

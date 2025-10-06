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

const NATIVE_ADDRESS_KEYS = [
  "native",
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "0x0000000000000000000000000000000000000000",
];

const isHexAddress = (address: string): boolean =>
  /^0x[0-9a-f]{40}$/i.test(address);

const isNativeAddress = (address: string | null | undefined): boolean =>
  !!address && NATIVE_ADDRESS_KEYS.includes(address.toLowerCase());

const resolveNativeAddressSentinel = (
  address: string | null | undefined,
  type?: string | null
): string[] => {
  console.log(`resolveNativeAddressSentinel: address="${address}", type="${type}"`);
  
  if (
    type === "native" ||
    isNativeAddress(address) ||
    address === "" ||
    address === null ||
    address === undefined
  ) {
    console.log("Resolved to native address");
    return ["native"];
  }

  console.log("Not resolved to native address");
  return [];
};

const normalizeBalanceLookupKeys = (
  token: { address?: string | null; type?: string | null }
): string[] => {
  const keys: string[] = [];

  const address = token.address?.toLowerCase();
  if (address) {
    keys.push(address);
  }

  const isNativeToken =
    token.type === "native" ||
    address === "native" ||
    address === "" ||
    address === null ||
    address === undefined;

  console.log(`normalizeBalanceLookupKeys for token:`, {
    address: token.address,
    type: token.type,
    isNativeToken,
    addressLower: address
  });

  if (isNativeToken) {
    keys.push(...NATIVE_ADDRESS_KEYS);
  } else if (
    address &&
    NATIVE_ADDRESS_KEYS.includes(address)
  ) {
    keys.push(...NATIVE_ADDRESS_KEYS);
  }

  const result = Array.from(new Set(keys));
  console.log(`normalizeBalanceLookupKeys result:`, result);
  return result;
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

  const tokens = query.data || [];

  const balanceAddresses = useMemo(() => {
    if (tokenAddressesOverride && tokenAddressesOverride.length > 0) {
      const normalizedOverride = tokenAddressesOverride
        .map(address => address?.toLowerCase())
        .filter((address): address is string => Boolean(address))
        .flatMap(address =>
          isNativeAddress(address)
            ? ["native", address]
            : [address]
        )
        .filter(
          (address): address is string =>
            Boolean(address) && (isHexAddress(address) || address === "native")
        );

      console.log("balanceAddresses (override):", Array.from(new Set(normalizedOverride)));
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
        Boolean(address) && (isHexAddress(address) || address === "native")
    );

    console.log("balanceAddresses (from tokens):", Array.from(new Set(filtered)));
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
    console.log("useZapTokensWithStates - balanceMap:", balanceMap);
    console.log("useZapTokensWithStates - tokens:", tokens);

    return tokens.map(token => {
      const candidateKeys = normalizeBalanceLookupKeys(token);
      console.log(`Token ${token.symbol} (${token.address}) candidate keys:`, candidateKeys);

      const balanceEntry = candidateKeys
        .map(key => {
          const entry = balanceMap[key];
          console.log(`Looking for key "${key}" in balanceMap:`, entry);
          return entry;
        })
        .find(entry => entry !== undefined);

      if (!balanceEntry) {
        console.log(`No balance found for token ${token.symbol}`);
        return token;
      }

      console.log(`Found balance for token ${token.symbol}:`, balanceEntry.balance);
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

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { createQueryConfig } from "./queryDefaults";
import { queryKeys } from "../../lib/queryClient";
import { tokenService } from "../../services";
import type { WalletTokenBalances } from "../../services/balanceService";
import type { SwapToken } from "../../types/swap";
import {
  useTokenBalancesQuery,
  type UseTokenBalancesParams,
} from "./useTokenBalancesQuery";
import { useTokenPricesQuery, type TokenPriceMap } from "./useTokenPricesQuery";
import { dedupeStrings } from "../../lib/stringUtils";

/**
 * Hook to fetch supported zap tokens for a specific chain
 * Uses React Query for caching, loading states, and error handling
 */
export const useZapTokensQuery = (chainId?: number) => {
  return useQuery({
    ...createQueryConfig({ dataType: "static" }),
    queryKey: queryKeys.zapTokens.byChain(chainId!),
    queryFn: () => tokenService.getZapTokens(chainId!),
    enabled: !!chainId && chainId > 0,
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
  priceEnabled?: boolean; // Default: false for backward compatibility
  priceRefetchInterval?: number | false; // Default: 2 minutes (from useTokenPricesQuery)
}

/**
 * Return type for useZapTokensWithStates hook
 * Includes token data enriched with balances and prices, plus loading/error states
 */
export interface UseZapTokensWithStatesResult {
  tokens: SwapToken[];
  hasTokens: boolean;
  isEmpty: boolean;
  isInitialLoading: boolean;
  isRefetching: boolean;
  // Balance states
  isBalanceLoading: boolean;
  isBalanceFetching: boolean;
  balanceError: Error | null;
  refetchBalances: () => void;
  balances: WalletTokenBalances | undefined;
  // Price states
  isPriceLoading: boolean;
  isPriceFetching: boolean;
  priceError: Error | null;
  refetchPrices: () => void;
  priceMap: TokenPriceMap;
  // React Query base states
  data?: SwapToken[] | undefined;
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  refetch: () => void;
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

  return dedupeStrings(keys);
};

export const useZapTokensWithStates = (
  options: UseZapTokensWithStatesOptions = {}
): UseZapTokensWithStatesResult => {
  const {
    chainId,
    walletAddress,
    skipBalanceCache = false,
    balanceEnabled = true,
    tokenAddressesOverride,
    priceEnabled = false,
    priceRefetchInterval,
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

      return dedupeStrings(normalizedOverride);
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

    return dedupeStrings(filtered);
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

  // Extract symbols for price queries
  const priceSymbols = useMemo(() => {
    if (!priceEnabled || tokens.length === 0) {
      return [];
    }

    // Extract and normalize symbols
    const symbols = tokens
      .map(token => token.symbol?.trim())
      .filter(
        (symbol): symbol is string => Boolean(symbol) && symbol.length > 0
      );

    // Deduplicate via utility
    return dedupeStrings(symbols);
  }, [tokens, priceEnabled]);

  // Fetch prices in parallel with balances
  const prices = useTokenPricesQuery({
    symbols: priceSymbols,
    enabled: priceEnabled && priceSymbols.length > 0,
    ...(priceRefetchInterval !== undefined && {
      refetchInterval: priceRefetchInterval,
    }),
  });

  const tokensWithBalances = useMemo(() => {
    if (tokens.length === 0) {
      return tokens;
    }

    const balanceMap = balances.balancesByAddress;
    const priceMap = prices.priceMap;

    return tokens.map(token => {
      // Balance enrichment (existing logic)
      const candidateKeys = normalizeBalanceLookupKeys(token);
      const balanceEntry = candidateKeys
        .map(key => balanceMap[key])
        .find(entry => entry !== undefined);

      // Price enrichment (NEW)
      const normalizedSymbol = token.symbol?.trim().toUpperCase();
      const priceEntry = normalizedSymbol
        ? priceMap[normalizedSymbol]
        : undefined;

      return {
        ...token,
        // Add balance if available
        ...(balanceEntry && { balance: balanceEntry.balance }),
        // Add price if available and successful
        ...(priceEntry?.success &&
          priceEntry.price !== null && {
            price: priceEntry.price,
          }),
      };
    });
  }, [tokens, balances.balancesByAddress, prices.priceMap]);

  return {
    // Token data
    tokens: tokensWithBalances,
    hasTokens: tokensWithBalances.length > 0,
    isEmpty: query.isSuccess && tokensWithBalances.length === 0,
    isInitialLoading: query.isLoading && !query.data,
    isRefetching: query.isFetching && !!query.data,
    // Balance states
    isBalanceLoading: balances.isLoading,
    isBalanceFetching: balances.isFetching,
    balanceError: balances.isError ? (balances.error as Error | null) : null,
    refetchBalances: balances.refetch,
    balances: balances.balances,
    // Price states
    isPriceLoading: prices.isLoading,
    isPriceFetching: prices.isFetching,
    priceError: prices.isError ? (prices.error as Error | null) : null,
    refetchPrices: prices.refetch,
    priceMap: prices.priceMap,
    // React Query base states
    data: query.data,
    error: query.error as Error | null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    refetch: query.refetch,
  };
};

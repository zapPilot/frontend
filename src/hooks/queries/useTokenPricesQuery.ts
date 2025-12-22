/**
 * Token Prices Query Hook
 * React Query hook for fetching and managing real-time token price data
 *
 * Provides automatic caching, refetching, and staleness detection for price data.
 * Follows the same patterns as useTokenBalancesQuery for consistency.
 *
 * @module hooks/queries/useTokenPricesQuery
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/lib/state/queryClient";

import {
  getTokenPrices,
  type TokenPriceData,
} from "../../services/priceService";
import { logger } from "../../utils/logger";
import { normalizeSymbols } from "../../utils/stringUtils";
import { createQueryConfig } from "./queryDefaults";

// Price-specific timing constants
// Updated to reduce API load while keeping prices reasonably fresh
const PRICE_STALE_TIME = 5 * 60 * 1000; // 5 minutes (was 2min) - align with backend cache
const PRICE_REFETCH_INTERVAL = 5 * 60 * 1000; // Auto-refetch every 5 minutes (was 2min)
const PRICE_STALENESS_THRESHOLD = 10 * 60 * 1000; // Consider stale after 10 minutes (was 5min)

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Normalized price data with timestamp for UI consumption
 */
interface NormalizedTokenPrice {
  symbol: string;
  price: number | null;
  timestamp: string;
  success: boolean;
  fromCache: boolean;
  isStale: boolean;
  error?: string | undefined;
}

/**
 * Map of symbol to price data for O(1) lookups
 */
export type TokenPriceMap = Record<string, NormalizedTokenPrice>;

/**
 * Hook parameters
 */
interface UseTokenPricesParams {
  /** Array of token symbols to fetch prices for */
  symbols?: string[];
  /** Enable/disable the query */
  enabled?: boolean;
  /** Auto-refetch interval (default: 2 minutes) */
  refetchInterval?: number | false;
  /** Override stale time (default: 2 minutes) */
  staleTime?: number;
}

/**
 * Hook return value
 */
interface UseTokenPricesResult {
  /** Array of price data in same order as requested symbols */
  prices: TokenPriceData[] | undefined;
  /** Normalized map for O(1) symbol lookups */
  priceMap: TokenPriceMap;
  /** Count of requested symbols */
  symbolCount: number;
  /** Count of successfully fetched prices */
  successCount: number;
  /** Count of failed fetches */
  failureCount: number;
  /** Whether any prices are considered stale (>5 min old) */
  hasStaleData: boolean;
  /** React Query loading state */
  isLoading: boolean;
  /** React Query fetching state */
  isFetching: boolean;
  /** React Query error state */
  isError: boolean;
  /** React Query error object */
  error: Error | null;
  /** Manual refetch function */
  refetch: () => void;
}

/**
 * Extended hook result with computed helper values
 */
interface UseTokenPricesWithStatesResult extends UseTokenPricesResult {
  /** Whether all requested prices succeeded */
  allSuccessful: boolean;
  /** Whether all requested prices failed */
  allFailed: boolean;
  /** Whether any prices succeeded */
  someSuccessful: boolean;
  /** Average age of price data in milliseconds */
  averageAge: number;
  /** Most stale timestamp in milliseconds since fetch */
  oldestDataAge: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if price data is stale based on timestamp
 */
const isPriceStale = (timestamp: string): boolean => {
  try {
    const priceTime = new Date(timestamp).getTime();
    const now = Date.now();
    return now - priceTime > PRICE_STALENESS_THRESHOLD;
  } catch {
    return true; // Treat invalid timestamps as stale
  }
};

/**
 * Calculate age of price data in milliseconds
 */
const getPriceAge = (timestamp: string): number => {
  try {
    const priceTime = new Date(timestamp).getTime();
    return Date.now() - priceTime;
  } catch {
    return Infinity;
  }
};

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Fetch and manage token price data with React Query
 *
 * @param params - Hook configuration parameters
 * @returns Price data with loading/error states and normalized map
 *
 * @example
 * ```typescript
 * const { priceMap, isLoading, hasStaleData } = useTokenPricesQuery({
 *   symbols: ['BTC', 'ETH', 'USDC'],
 *   enabled: true,
 * });
 *
 * if (isLoading) return <Loading />;
 * if (hasStaleData) return <StaleDataWarning />;
 *
 * const btcPrice = priceMap['BTC']?.price;
 * ```
 */
export const useTokenPricesQuery = (
  params: UseTokenPricesParams
): UseTokenPricesResult => {
  const {
    symbols = [],
    enabled = true,
    refetchInterval = PRICE_REFETCH_INTERVAL,
    staleTime = PRICE_STALE_TIME,
  } = params;

  // Normalize symbols for consistent query behavior
  const normalizedSymbols = useMemo(() => normalizeSymbols(symbols), [symbols]);

  // Determine if query should be enabled
  const queryEnabled = Boolean(enabled && normalizedSymbols.length > 0);

  // Execute React Query
  const query = useQuery({
    ...createQueryConfig({ dataType: "dynamic" }),
    queryKey: queryKeys.prices.list(normalizedSymbols.join(",")),
    queryFn: () => getTokenPrices(normalizedSymbols),
    enabled: queryEnabled,
    staleTime, // Allow override from params
    refetchInterval: queryEnabled ? refetchInterval : false,
  });

  // Normalize to map for O(1) lookups with staleness detection
  const priceMap = useMemo<TokenPriceMap>(() => {
    if (!query.data) {
      return {};
    }

    return query.data.reduce<TokenPriceMap>((acc, priceData) => {
      const symbol = priceData.symbol.toUpperCase();
      acc[symbol] = {
        symbol,
        price: priceData.price,
        timestamp: priceData.timestamp,
        success: priceData.success,
        fromCache: priceData.fromCache,
        isStale: isPriceStale(priceData.timestamp),
        error: priceData.error,
      };
      return acc;
    }, {});
  }, [query.data]);

  // Compute success/failure counts
  const { successCount, failureCount } = useMemo(() => {
    if (!query.data) {
      return { successCount: 0, failureCount: 0 };
    }

    return query.data.reduce(
      (acc, price) => {
        if (price.success && price.price !== null) {
          acc.successCount++;
        } else {
          acc.failureCount++;
        }
        return acc;
      },
      { successCount: 0, failureCount: 0 }
    );
  }, [query.data]);

  // Check for stale data
  const hasStaleData = useMemo(() => {
    if (!query.data) {
      return false;
    }

    return query.data.some(price => isPriceStale(price.timestamp));
  }, [query.data]);

  const triggerRefetch = () => {
    void (async () => {
      try {
        await query.refetch();
      } catch (error) {
        logger.error("Failed to refetch token prices", error);
      }
    })();
  };

  return {
    prices: query.data,
    priceMap,
    symbolCount: normalizedSymbols.length,
    successCount,
    failureCount,
    hasStaleData,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: triggerRefetch,
  };
};

// =============================================================================
// EXTENDED HOOK WITH COMPUTED STATES
// =============================================================================

/**
 * Extended version with additional computed helper values
 *
 * @param params - Hook configuration parameters
 * @returns Extended price data with computed boolean states and age metrics
 *
 * @example
 * ```typescript
 * const {
 *   priceMap,
 *   allSuccessful,
 *   averageAge,
 *   oldestDataAge
 * } = useTokenPricesWithStates({
 *   symbols: ['BTC', 'ETH', 'USDC'],
 * });
 *
 * if (allSuccessful && averageAge < 60_000) {
 *   // All prices fresh (< 1 minute old)
 *   renderPrices(priceMap);
 * }
 * ```
 */
export const useTokenPricesWithStates = (
  params: UseTokenPricesParams
): UseTokenPricesWithStatesResult => {
  const baseResult = useTokenPricesQuery(params);

  // Compute additional helper states
  const computedStates = useMemo(() => {
    const { prices, symbolCount, successCount, failureCount } = baseResult;

    // Boolean convenience flags
    const allSuccessful = symbolCount > 0 && successCount === symbolCount;
    const allFailed = symbolCount > 0 && failureCount === symbolCount;
    const someSuccessful = successCount > 0;

    // Age calculations
    let totalAge = 0;
    let oldestAge = 0;

    if (prices) {
      for (const price of prices) {
        const age = getPriceAge(price.timestamp);
        totalAge += age;
        oldestAge = Math.max(oldestAge, age);
      }
    }

    const averageAge = symbolCount > 0 ? totalAge / symbolCount : 0;

    return {
      allSuccessful,
      allFailed,
      someSuccessful,
      averageAge,
      oldestDataAge: oldestAge,
    };
  }, [baseResult]);

  return {
    ...baseResult,
    ...computedStates,
  };
};

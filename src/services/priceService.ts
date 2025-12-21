/**
 * Price Service
 * Service functions for fetching token price data from backend API
 *
 * Provides single and bulk token price fetching with normalization
 * to consistent response format for UI consumption.
 *
 * @module services/priceService
 */

import { createServiceCaller } from "../lib/createServiceCaller";
import { createIntentServiceError } from "../lib/errors";
import { httpUtils } from "../lib/http-utils";
import { normalizeSymbol, normalizeSymbols } from "../utils/stringUtils";

// Get configured client
const intentEngineClient = httpUtils.intentEngine;

const callPriceService = createServiceCaller(createIntentServiceError);

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Additional price metadata from provider
 */
interface PriceMetadata {
  /** Market capitalization in USD */
  marketCap?: number;
  /** 24-hour trading volume in USD */
  volume24h?: number;
  /** 24-hour price change percentage */
  percentChange24h?: number;
  /** 7-day price change percentage */
  percentChange7d?: number;
  /** Circulating supply */
  circulatingSupply?: number;
  /** Maximum supply */
  maxSupply?: number;
}

/**
 * Individual token price data
 */
interface TokenPrice {
  /** Token symbol (normalized to lowercase) */
  symbol: string;
  /** Current price in USD */
  price: number;
  /** Data provider name */
  provider: string;
  /** ISO timestamp of price data */
  timestamp: string;
  /** Whether price was served from cache */
  fromCache: boolean;
  /** Optional extended market data */
  metadata?: PriceMetadata | undefined;
}

/**
 * Normalized price data for UI consumption
 * Provides consistent interface regardless of single/bulk fetch
 */
export interface TokenPriceData {
  /** Token symbol */
  symbol: string;
  /** Current price in USD, null if fetch failed */
  price: number | null;
  /** Whether price was successfully fetched */
  success: boolean;
  /** Error message if fetch failed */
  error?: string | undefined;
  /** ISO timestamp */
  timestamp: string;
  /** Whether served from cache */
  fromCache: boolean;
  /** Optional metadata */
  metadata?: PriceMetadata | undefined;
}

/**
 * Response from bulk price endpoint
 */
interface BulkPriceResponse {
  /** Map of symbol to price data */
  results: Record<string, TokenPrice>;
  /** Array of symbols that failed to fetch */
  errors: string[];
  /** Total number of symbols requested */
  totalRequested: number;
  /** Number of prices served from cache */
  fromCache: number;
  /** Number of prices fetched from provider */
  fromProviders: number;
  /** Number of failed requests */
  failed: number;
  /** ISO timestamp of response */
  timestamp: string;
}

/**
 * Response from single price endpoint
 */
interface SinglePriceResponse {
  success: boolean;
  price: number;
  symbol: string;
  provider: string;
  timestamp: string;
  fromCache: boolean;
  metadata?: PriceMetadata | undefined;
}

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Fetch prices for multiple tokens in a single request
 *
 * @param symbols - Array of token symbols (case-insensitive, will be normalized)
 * @returns Promise<TokenPriceData[]> - Array of normalized price data
 *
 * @example
 * ```typescript
 * const prices = await getTokenPrices(['BTC', 'ETH', 'USDC']);
 * prices.forEach(({ symbol, price, success }) => {
 *   if (success) {
 *     apiLogger.debug(`${symbol}: $${price}`);
 *   }
 * });
 * ```
 *
 * @remarks
 * - Empty array returns empty result immediately
 * - Duplicate symbols are automatically deduplicated
 * - Failed individual fetches return null price with success: false
 * - Backend automatically handles rate limiting and caching
 */
export const getTokenPrices = (symbols: string[]): Promise<TokenPriceData[]> =>
  callPriceService(async () => {
    // Handle empty input
    if (!symbols || symbols.length === 0) {
      return [];
    }

    // Normalize and deduplicate symbols (uppercase for API compatibility)
    const normalizedSymbols = normalizeSymbols(symbols).map(s =>
      s.toLowerCase()
    );

    if (normalizedSymbols.length === 0) {
      return [];
    }

    // Fetch bulk prices
    const response = await intentEngineClient.get<BulkPriceResponse>(
      `/tokens/prices?tokens=${normalizedSymbols.join(",")}`
    );

    if (!response?.results) {
      return normalizedSymbols.map(symbol => ({
        symbol,
        price: null,
        success: false,
        error: "Invalid response from price service",
        timestamp: new Date().toISOString(),
        fromCache: false,
      }));
    }

    // Normalize to consistent format
    return normalizedSymbols.map(symbol => {
      const priceData = response.results[symbol];
      const hasFailed = response.errors.includes(symbol);

      if (!priceData || hasFailed) {
        return {
          symbol,
          price: null,
          success: false,
          error: `Price data unavailable for ${symbol}`,
          timestamp: response.timestamp,
          fromCache: false,
        };
      }

      return {
        symbol: priceData.symbol,
        price: priceData.price,
        success: true,
        timestamp: priceData.timestamp,
        fromCache: priceData.fromCache,
        metadata: priceData.metadata,
      };
    });
  });

/**
 * Fetch price for a single token
 *
 * @param symbol - Token symbol (case-insensitive, will be normalized)
 * @returns Promise<TokenPriceData> - Normalized price data
 *
 * @example
 * ```typescript
 * const btcPrice = await getTokenPrice('BTC');
 * if (btcPrice.success) {
 *   apiLogger.debug(`Bitcoin: $${btcPrice.price}`);
 *   apiLogger.debug(`Market Cap: $${btcPrice.metadata?.marketCap}`);
 * }
 * ```
 *
 * @remarks
 * - Empty/whitespace symbol returns failed result
 * - Uses dedicated single-price endpoint for efficiency
 * - Includes extended metadata when available
 */
export const getTokenPrice = (symbol: string): Promise<TokenPriceData> =>
  callPriceService(async () => {
    // Validate and normalize input
    const normalizedSymbol = normalizeSymbol(symbol).toLowerCase();

    if (!normalizedSymbol) {
      return {
        symbol: symbol || "",
        price: null,
        success: false,
        error: "Invalid symbol provided",
        timestamp: new Date().toISOString(),
        fromCache: false,
      };
    }

    const response = await intentEngineClient.get<SinglePriceResponse>(
      `/tokens/price/${normalizedSymbol}`
    );

    if (!response?.success) {
      return {
        symbol: normalizedSymbol,
        price: null,
        success: false,
        error: `Price unavailable for ${normalizedSymbol}`,
        timestamp: response?.timestamp || new Date().toISOString(),
        fromCache: false,
      };
    }

    return {
      symbol: response.symbol,
      price: response.price,
      success: true,
      timestamp: response.timestamp,
      fromCache: response.fromCache,
      metadata: response.metadata,
    };
  });

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Filter successful price results from bulk fetch
 *
 * @param prices - Array of price data from getTokenPrices
 * @returns Array of successfully fetched prices
 *
 * @example
 * ```typescript
 * const allPrices = await getTokenPrices(['BTC', 'ETH', 'INVALID']);
 * const validPrices = getSuccessfulPrices(allPrices);
 * // Returns only BTC and ETH if INVALID failed
 * ```
 */
export const getSuccessfulPrices = (
  prices: TokenPriceData[]
): TokenPriceData[] => prices.filter(p => p.success && p.price !== null);

/**
 * Create a price lookup map for O(1) access
 *
 * @param prices - Array of price data
 * @returns Map of symbol to price data
 *
 * @example
 * ```typescript
 * const prices = await getTokenPrices(['BTC', 'ETH']);
 * const priceMap = createPriceLookup(prices);
 * const btcPrice = priceMap.get('btc')?.price;
 * ```
 */
export const createPriceLookup = (
  prices: TokenPriceData[]
): Map<string, TokenPriceData> => {
  return new Map(prices.map(p => [p.symbol.toLowerCase(), p]));
};

/**
 * Calculate total USD value from token amounts and prices
 *
 * @param amounts - Map of symbol to token amount
 * @param prices - Array of price data
 * @returns Total USD value, or null if any price is missing
 *
 * @example
 * ```typescript
 * const amounts = new Map([['btc', 2], ['eth', 10]]);
 * const prices = await getTokenPrices(['BTC', 'ETH']);
 * const totalValue = calculateTotalValue(amounts, prices);
 * apiLogger.debug(`Portfolio value: $${totalValue}`);
 * ```
 */
export const calculateTotalValue = (
  amounts: Map<string, number>,
  prices: TokenPriceData[]
): number | null => {
  const priceMap = createPriceLookup(prices);
  let total = 0;

  for (const [symbol, amount] of amounts.entries()) {
    const priceData = priceMap.get(symbol.toLowerCase());

    if (!priceData?.success || priceData.price === null) {
      return null; // Cannot calculate if any price is missing
    }

    total += amount * priceData.price;
  }

  return total;
};

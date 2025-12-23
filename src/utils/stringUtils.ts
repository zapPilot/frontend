/**
 * String Normalization Utilities
 *
 * Centralized string manipulation functions to eliminate duplication across
 * query hooks, service functions, and component logic.
 *
 * @module stringUtils
 */

/**
 * Options for the normalizeStrings function
 */
interface NormalizeOptions {
  /**
   * Case transformation to apply
   * - 'lower': Convert to lowercase (default for addresses)
   * - 'upper': Convert to uppercase (default for symbols)
   * - 'none': No case transformation
   * @default 'none'
   */
  case?: "lower" | "upper" | "none";

  /**
   * Remove duplicate strings from the result
   * @default false
   */
  dedupe?: boolean;

  /**
   * Trim whitespace from each string
   * @default true
   */
  trim?: boolean;

  /**
   * Filter out empty strings after normalization
   * @default true
   */
  filter?: boolean;
}

/**
 * Normalize an array of strings with configurable transformations
 *
 * Common use cases:
 * - Normalizing wallet addresses for API calls
 * - Normalizing token symbols for lookups
 * - Deduplicating user input arrays
 *
 * @example
 * // Normalize wallet addresses
 * normalizeStrings(['0xABC...', ' 0xDEF... '], { case: 'lower', dedupe: true })
 * // => ['0xabc...', '0xdef...']
 *
 * @example
 * // Normalize token symbols
 * normalizeStrings(['eth', ' USDC ', 'eth'], { case: 'upper', dedupe: true })
 * // => ['ETH', 'USDC']
 *
 * @example
 * // Basic cleanup with defaults
 * normalizeStrings([' hello ', '', '  world  '])
 * // => ['hello', 'world']
 *
 * @param strings - Array of strings to normalize
 * @param options - Normalization configuration
 * @returns Normalized string array
 */
function normalizeStrings(
  strings: string[],
  options: NormalizeOptions = {}
): string[] {
  const {
    case: caseTransform = "none",
    dedupe = false,
    trim = true,
    filter = true,
  } = options;

  let result = strings;

  // Apply trimming first
  if (trim) {
    result = result.map(s => s.trim());
  }

  // Apply case transformation
  if (caseTransform === "lower") {
    result = result.map(s => s.toLowerCase());
  } else if (caseTransform === "upper") {
    result = result.map(s => s.toUpperCase());
  }

  // Filter empty strings
  if (filter) {
    result = result.filter(s => s.length > 0);
  }

  // Deduplicate
  if (dedupe) {
    result = Array.from(new Set(result));
  }

  return result;
}

/**
 * Normalize a wallet address for consistent comparison and API calls
 *
 * Applies lowercase transformation and trimming, which is the standard
 * format for Ethereum addresses in queries and comparisons.
 *
 * Used in:
 * - useTokenBalancesQuery.ts
 * - usePortfolioQuery.ts
 * - accountService.ts
 * - Any address comparison logic
 *
 * @example
 * normalizeAddress('0xABC123...')
 * // => '0xabc123...'
 *
 * @example
 * normalizeAddress('  0xDEF456...  ')
 * // => '0xdef456...'
 *
 * @param address - Wallet address to normalize
 * @returns Normalized address (lowercase, trimmed)
 */
export function normalizeAddress(address: string): string {
  return address.toLowerCase().trim();
}

/**
 * Normalize multiple wallet addresses
 *
 * Convenience function for normalizing address arrays with deduplication.
 * This is the most common pattern in query hooks.
 *
 * Used in:
 * - useTokenBalancesQuery.ts
 * - useWalletQuery.ts
 * - bundleService.ts
 *
 * @example
 * normalizeAddresses(['0xABC...', '0xDEF...', '0xABC...'])
 * // => ['0xabc...', '0xdef...']
 *
 * @param addresses - Array of wallet addresses
 * @returns Normalized and deduplicated addresses
 */
export function normalizeAddresses(addresses: string[]): string[] {
  return normalizeStrings(addresses, {
    case: "lower",
    dedupe: true,
    trim: true,
    filter: true,
  });
}

/**
 * Normalize a token symbol for consistent lookups
 *
 * Applies uppercase transformation and trimming, which is the standard
 * format for token symbols in price feeds and API calls.
 *
 * Used in:
 * - useTokenPricesQuery.ts
 * - analyticsService.ts
 * - Token symbol comparisons
 *
 * @example
 * normalizeSymbol('eth')
 * // => 'ETH'
 *
 * @example
 * normalizeSymbol('  usdc  ')
 * // => 'USDC'
 *
 * @param symbol - Token symbol to normalize
 * @returns Normalized symbol (uppercase, trimmed)
 */
export function normalizeSymbol(symbol: string): string {
  return symbol.toUpperCase().trim();
}

/**
 * Normalize multiple token symbols
 *
 * Convenience function for normalizing symbol arrays with deduplication.
 * Common pattern in price query hooks and token operations.
 *
 * Used in:
 * - useTokenPricesQuery.ts
 * - poolService.ts
 * - Token filtering logic
 *
 * @example
 * normalizeSymbols(['eth', ' USDC ', 'eth'])
 * // => ['ETH', 'USDC']
 *
 * @param symbols - Array of token symbols
 * @returns Normalized and deduplicated symbols
 */
export function normalizeSymbols(symbols: string[]): string[] {
  return normalizeStrings(symbols, {
    case: "upper",
    dedupe: true,
    trim: true,
    filter: true,
  });
}

// Unused removed: isValidString, normalizeForComparison, normalizeProtocolName, dedupeStrings

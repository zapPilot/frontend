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
export interface NormalizeOptions {
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
export function normalizeStrings(
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

/**
 * Remove duplicate strings from an array
 *
 * Simple deduplication utility that preserves the order of first occurrence.
 * Case-sensitive by default - normalize case first if needed.
 *
 * @example
 * dedupeStrings(['a', 'b', 'a', 'c'])
 * // => ['a', 'b', 'c']
 *
 * @example
 * dedupeStrings(['ETH', 'eth', 'USDC'])
 * // => ['ETH', 'eth', 'USDC'] (case-sensitive)
 *
 * @param strings - Array of strings to deduplicate
 * @returns Array with duplicates removed
 */
export function dedupeStrings(strings: string[]): string[] {
  return Array.from(new Set(strings));
}

/**
 * Type guard to check if a value is a non-empty string
 *
 * Useful for filtering and validating user input, API responses,
 * and ensuring type safety in string operations.
 *
 * Used in:
 * - Form validation
 * - API response filtering
 * - Array filtering with type narrowing
 *
 * @example
 * const values = ['hello', '', null, undefined, 'world']
 * values.filter(isValidString)
 * // => ['hello', 'world'] (TypeScript knows these are strings)
 *
 * @example
 * if (isValidString(userInput)) {
 *   // TypeScript knows userInput is string here
 *   const normalized = normalizeAddress(userInput)
 * }
 *
 * @param str - Value to check
 * @returns True if str is a non-empty string
 */
export function isValidString(str: unknown): str is string {
  return typeof str === "string" && str.trim().length > 0;
}

/**
 * Filter an array to only valid (non-empty) strings with type narrowing
 *
 * Combines filtering and type narrowing in a single operation.
 * Alternative to Array.filter(isValidString) with better semantics.
 *
 * @example
 * const mixed = ['hello', '', null, undefined, '  ', 'world']
 * filterValidStrings(mixed)
 * // => ['hello', 'world']
 *
 * @param values - Array of unknown values
 * @returns Array of valid strings only
 */
export function filterValidStrings(values: unknown[]): string[] {
  return values.filter(isValidString);
}

/**
 * Normalize a string for case-insensitive comparison
 *
 * Common pattern for search, filtering, and matching operations.
 * Returns empty string for invalid input to avoid null/undefined issues.
 *
 * @example
 * const search = normalizeForComparison('  Hello World  ')
 * const data = ['hello world', 'HELLO WORLD', 'Hello World']
 * data.filter(item => normalizeForComparison(item) === search)
 * // => all three items match
 *
 * @param str - String to normalize
 * @returns Lowercase trimmed string, or empty string for invalid input
 */
export function normalizeForComparison(str: unknown): string {
  if (!isValidString(str)) {
    return "";
  }
  return str.toLowerCase().trim();
}

/**
 * Check if two strings are equal after normalization
 *
 * Case-insensitive, whitespace-insensitive string comparison.
 * Useful for user input validation and search matching.
 *
 * @example
 * stringEquals('  Hello  ', 'hello')
 * // => true
 *
 * @example
 * stringEquals('ETH', 'eth')
 * // => true
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns True if strings are equal after normalization
 */
export function stringEquals(str1: unknown, str2: unknown): boolean {
  return normalizeForComparison(str1) === normalizeForComparison(str2);
}

/**
 * Truncate a string with ellipsis
 *
 * Common pattern for displaying long addresses, transaction hashes,
 * and other identifiers in the UI.
 *
 * @example
 * truncateString('0x1234567890abcdef', 8)
 * // => '0x123...'
 *
 * @example
 * truncateString('Hello World', 20)
 * // => 'Hello World' (no truncation needed)
 *
 * @example
 * truncateString('0x1234567890abcdef', 10, '***')
 * // => '0x1234567***'
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @param ellipsis - String to append when truncated
 * @returns Truncated string or original if shorter than maxLength
 */
export function truncateString(
  str: string,
  maxLength: number,
  ellipsis = "..."
): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Truncate address with middle ellipsis
 *
 * Display format for Ethereum addresses: 0x1234...abcd
 * Shows start and end while truncating the middle.
 *
 * Common in wallet UIs and transaction displays.
 *
 * @example
 * truncateAddress('0x1234567890abcdef1234567890abcdef12345678')
 * // => '0x1234...5678'
 *
 * @example
 * truncateAddress('0x1234567890abcdef1234567890abcdef12345678', 6, 6)
 * // => '0x123456...345678'
 *
 * @param address - Address to truncate
 * @param startLength - Number of characters to show at start
 * @param endLength - Number of characters to show at end
 * @returns Truncated address
 */
export function truncateAddress(
  address: string,
  startLength = 6,
  endLength = 4
): string {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

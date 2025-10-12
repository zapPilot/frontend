/**
 * Token Utilities (TypeScript Migration)
 *
 * Provides utility functions for token data processing and manipulation.
 * Migrated from JavaScript with comprehensive TypeScript typing.
 *
 * @module utils/tokenUtils
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface Token {
  /** Token symbol */
  symbol: string;
  /** Optimized symbol (if available) */
  optimized_symbol?: string | undefined;
  /** Token amount/balance */
  amount: number;
  /** Token price in USD */
  price: number;
  /** Token decimals */
  decimals?: number | undefined;
  /** Token address */
  address?: string | undefined;
  /** Raw amount as hex string */
  raw_amount_hex_str?: string | undefined;
}

export interface FilteredTokenResult {
  /** Filtered and sorted tokens */
  tokens: Token[];
  /** Total value of all filtered tokens */
  totalValue: number;
  /** Number of tokens removed by filtering */
  filteredCount: number;
}

/** Interface for unvalidated token input from external sources */
export interface UnvalidatedTokenInput {
  symbol?: unknown;
  optimized_symbol?: unknown;
  amount?: unknown;
  price?: unknown;
  decimals?: unknown;
  address?: unknown;
  raw_amount_hex_str?: unknown;
  logo_url?: unknown;
  name?: unknown;
  [key: string]: unknown;
}

// =============================================================================
// SYMBOL AND METADATA UTILITIES
// =============================================================================

/**
 * Gets the optimized symbol for a token with fallback
 *
 * @param token - The token object
 * @returns The best available symbol for display
 */
export function getTokenSymbol(token: Token): string {
  return token.optimized_symbol || token.symbol || "UNKNOWN";
}

/**
 * Get display name for token (symbol with optional name)
 *
 * @param token - Token object
 * @param includeName - Whether to include full name if available
 * @returns Formatted display name
 */
export function getTokenDisplayName(
  token: Token & { name?: string },
  includeName = false
): string {
  const symbol = getTokenSymbol(token);

  if (includeName && token.name && token.name !== symbol) {
    return `${symbol} (${token.name})`;
  }

  return symbol;
}

// =============================================================================
// FILTERING AND SORTING UTILITIES
// =============================================================================

/**
 * Filters and sorts tokens by their total value
 * Removes tokens with zero price or amount
 *
 * @param tokens - Array of token objects
 * @returns Filtered and sorted tokens with metadata
 */
export function getFilteredAndSortedTokens(
  tokens: Token[]
): FilteredTokenResult {
  if (!tokens || !Array.isArray(tokens)) {
    return {
      tokens: [],
      totalValue: 0,
      filteredCount: 0,
    };
  }

  const originalCount = tokens.length;

  const filtered = tokens
    .filter(token => token.price > 0)
    .filter(token => token.amount > 0);

  const sorted = filtered.sort(
    (a, b) => b.amount * b.price - a.amount * a.price
  );

  const totalValue = calculateTotalTokenValue(sorted);
  const filteredCount = originalCount - filtered.length;

  return {
    tokens: sorted,
    totalValue,
    filteredCount,
  };
}

// =============================================================================
// CALCULATION UTILITIES
// =============================================================================

/**
 * Calculates the total USD value of a token array
 *
 * @param tokens - Array of token objects
 * @returns Total value in USD
 */
export function calculateTotalTokenValue(tokens: Token[]): number {
  if (!tokens || !Array.isArray(tokens)) return 0;

  return tokens.reduce((total, token) => {
    const value = token.amount * token.price;
    return total + (isNaN(value) ? 0 : value);
  }, 0);
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate token object structure
 *
 * @param token - Token to validate
 * @returns Validation result
 */
export function validateToken(token: UnvalidatedTokenInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!token || typeof token !== "object") {
    errors.push("Token must be a valid object");
    return { isValid: false, errors };
  }

  if (typeof token.symbol !== "string" || !token.symbol.trim()) {
    errors.push("Token must have a valid symbol");
  }

  if (
    typeof token.amount !== "number" ||
    isNaN(token.amount) ||
    token.amount < 0
  ) {
    errors.push("Token amount must be a non-negative number");
  }

  if (
    typeof token.price !== "number" ||
    isNaN(token.price) ||
    token.price < 0
  ) {
    errors.push("Token price must be a non-negative number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize token data for safe processing
 *
 * @param token - Raw token data
 * @returns Sanitized token
 */
export function sanitizeToken(token: UnvalidatedTokenInput): Token | null {
  const { isValid } = validateToken(token);

  if (!isValid) return null;

  return {
    symbol: String(token.symbol).trim().toUpperCase(),
    optimized_symbol: token.optimized_symbol
      ? String(token.optimized_symbol).trim()
      : undefined,
    amount: Math.max(0, Number(token.amount) || 0),
    price: Math.max(0, Number(token.price) || 0),
    decimals: token.decimals
      ? Math.max(0, Math.floor(Number(token.decimals)))
      : undefined,
    address: token.address ? String(token.address).trim() : undefined,
    raw_amount_hex_str: token.raw_amount_hex_str
      ? String(token.raw_amount_hex_str)
      : undefined,
  } as Token;
}

/**
 * Batch sanitize array of tokens
 *
 * @param tokens - Array of raw token data
 * @returns Array of sanitized tokens
 */
export function sanitizeTokens(tokens: UnvalidatedTokenInput[]): Token[] {
  if (!Array.isArray(tokens)) return [];

  return tokens
    .map(sanitizeToken)
    .filter((token): token is Token => token !== null);
}

// =============================================================================
// LEGACY EXPORTS (for backward compatibility)
// =============================================================================

export {
  getFilteredAndSortedTokens as getFilteredTokens,
  calculateTotalTokenValue as getTotalValue,
};

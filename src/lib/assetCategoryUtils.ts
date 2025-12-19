/**
 * Asset Category Utilities
 *
 * Utilities for mapping tokens to asset categories and filtering
 * tokens by category for UI components.
 */

import { ASSET_SYMBOL_SETS } from "@/constants/assetSymbols";

/**
 * Asset category keys matching portfolio.ts
 */
export type AssetCategoryKey = "btc" | "eth" | "stablecoin" | "altcoin";

/**
 * Extended category type including "all" for UI filters
 */
export type CategoryFilter = AssetCategoryKey | "all";

/**
 * Maps a token symbol to its asset category
 *
 * @param symbol - Token symbol (case-insensitive)
 * @returns The asset category key, defaults to "altcoin" if not found
 *
 * @example
 * getCategoryForToken("WBTC") // "btc"
 * getCategoryForToken("usdc") // "stablecoin"
 * getCategoryForToken("LINK") // "altcoin"
 */
export function getCategoryForToken(symbol: string): AssetCategoryKey {
  const normalized = symbol.toLowerCase();

  if (ASSET_SYMBOL_SETS.btc.has(normalized)) {
    return "btc";
  }

  if (ASSET_SYMBOL_SETS.eth.has(normalized)) {
    return "eth";
  }

  if (ASSET_SYMBOL_SETS.stablecoins.has(normalized)) {
    return "stablecoin";
  }

  // Default to altcoin for unrecognized tokens
  return "altcoin";
}

/**
 * Filters an array of tokens by category
 *
 * @param tokens - Array of token objects with a `symbol` property
 * @param category - Category to filter by, or "all" for no filtering
 * @returns Filtered array of tokens
 *
 * @example
 * const tokens = [{ symbol: "BTC" }, { symbol: "USDC" }, { symbol: "ETH" }]
 * filterTokensByCategory(tokens, "btc") // [{ symbol: "BTC" }]
 * filterTokensByCategory(tokens, "all") // all tokens
 */
export function filterTokensByCategory<T extends { symbol: string }>(
  tokens: T[],
  category: CategoryFilter
): T[] {
  if (category === "all") {
    return tokens;
  }

  return tokens.filter(token => getCategoryForToken(token.symbol) === category);
}

/**
 * Gets a count of tokens by category
 *
 * @param tokens - Array of token objects with a `symbol` property
 * @returns Record mapping each category to its token count
 *
 * @example
 * const tokens = [{ symbol: "BTC" }, { symbol: "USDC" }, { symbol: "ETH" }]
 * getTokenCountsByCategory(tokens)
 * // { btc: 1, eth: 1, stablecoin: 1, altcoin: 0 }
 */
export function getTokenCountsByCategory<T extends { symbol: string }>(
  tokens: T[]
): Record<AssetCategoryKey, number> {
  const counts: Record<AssetCategoryKey, number> = {
    btc: 0,
    eth: 0,
    stablecoin: 0,
    altcoin: 0,
  };

  for (const token of tokens) {
    const category = getCategoryForToken(token.symbol);
    counts[category]++;
  }

  return counts;
}

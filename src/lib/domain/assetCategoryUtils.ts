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

// Unused type removed: CategoryFilter

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

// Unused exports removed: filterTokensByCategory, getTokenCountsByCategory

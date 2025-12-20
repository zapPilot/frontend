/**
 * Wallet Portfolio Constants
 *
 * Centralized configuration constants for wallet portfolio management.
 * This eliminates duplication across adapter files and provides a single
 * source of truth for colors, defaults, and magic numbers.
 */

import type { WalletPortfolioAllocationData } from "./types";

/**
 * Asset color mapping for consistent visualization across components
 *
 * These colors are used in portfolio composition charts, legends, and pills.
 * Centralizing them here ensures consistency and eliminates duplication.
 */
export const ASSET_COLORS = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  SOL: "#14F195",
  ALT: "#8C8C8C", // Others/Altcoins
  USDC: "#2775CA",
  USDT: "#26A17B",
} as const;

/**
 * Default stablecoin split ratio
 *
 * NOTE: This is an estimated split since the backend API returns aggregated
 * stablecoin totals without USDC/USDT breakdown. Update when backend provides
 * actual per-stablecoin values.
 */
export const DEFAULT_STABLE_SPLIT = {
  USDC: 60,
  USDT: 40,
} as const;

/**
 * Default regime when no sentiment data is available
 * "n" = Neutral regime (50/50 allocation)
 */
export const DEFAULT_REGIME = "n" as const;

/**
 * Zero allocation constant for empty portfolio state
 *
 * Used when total assets are zero to prevent division by zero errors
 * and provide clean empty state representation.
 */
export const ZERO_ALLOCATION: WalletPortfolioAllocationData = {
  crypto: 0,
  stable: 0,
  constituents: { crypto: [], stable: [] },
  simplifiedCrypto: [],
};

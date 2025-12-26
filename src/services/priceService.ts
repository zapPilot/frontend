/**
 * Price Service
 * Service functions for fetching token price data from backend API
 *
 * NOTE: This service is currently unused but kept for potential future use.
 * All price-related functionality has been moved to other service modules.
 *
 * @module services/priceService
 */

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

/**
 * Asset Worker Configuration
 * Centralized configuration for external asset CDN and image services
 */

/**
 * Zap Assets Worker Configuration
 * Custom Cloudflare Worker service for fetching and caching cryptocurrency
 * token images and protocol logos from multiple sources (CoinGecko, DefiLlama, etc.)
 */
export const ASSET_WORKER_CONFIG = {
  /**
   * Base URL for the Zap Assets Worker
   * @see https://github.com/davidtnfsh/zap-assets-worker
   */
  BASE_URL: "https://zap-assets-worker.davidtnfsh.workers.dev",

  /**
   * Path for token/cryptocurrency images
   * Format: {BASE_URL}{TOKEN_PICTURES_PATH}/{symbol}.webp
   * Example: .../tokenPictures/btc.webp
   */
  TOKEN_PICTURES_PATH: "/tokenPictures" as const,

  /**
   * Path for protocol/project logos
   * Format: {BASE_URL}{PROJECT_PICTURES_PATH}/{protocol_id}.webp
   * Example: .../projectPictures/aave.webp
   */
  PROJECT_PICTURES_PATH: "/projectPictures" as const,
} as const;

/**
 * Helper function to construct full asset URLs
 * @param type - Asset type ('token' or 'protocol')
 * @param identifier - Token symbol or protocol name (will be lowercased)
 * @returns Full URL to the asset image
 */
export const getAssetUrl = (
  type: "token" | "protocol",
  identifier: string
): string => {
  const path =
    type === "token"
      ? ASSET_WORKER_CONFIG.TOKEN_PICTURES_PATH
      : ASSET_WORKER_CONFIG.PROJECT_PICTURES_PATH;
  return `${ASSET_WORKER_CONFIG.BASE_URL}${path}/${identifier}.webp`;
};

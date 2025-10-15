/**
 * Portfolio Constants
 *
 * Consolidated constants for portfolio management and display configuration.
 * Single source of truth for asset categories, colors, and labels.
 */

/**
 * Asset Category Keys
 * Type-safe keys for all supported asset categories
 */
export type AssetCategoryKey = "btc" | "eth" | "stablecoin" | "altcoin";

/**
 * Asset Category Definition
 * Complete metadata for each asset category
 */
export interface AssetCategory {
  /** Unique identifier key */
  key: AssetCategoryKey;
  /** Full display name */
  label: string;
  /** Short display name/symbol */
  shortLabel: string;
  /** Chart-optimized color (hex) - high contrast for data visualization */
  chartColor: string;
  /** Brand/identity color (hex) - matches asset branding */
  brandColor: string;
  /** Tailwind CSS color class for text (e.g., 'text-amber-400') */
  tailwindColor: string;
}

/**
 * Comprehensive Asset Categories
 * Single source of truth for all asset category metadata
 */
export const ASSET_CATEGORIES: Record<AssetCategoryKey, AssetCategory> = {
  btc: {
    key: "btc",
    label: "Bitcoin",
    shortLabel: "BTC",
    chartColor: "#f59e0b", // Amber - optimized for chart visibility
    brandColor: "#F7931A", // Bitcoin orange - official brand color
    tailwindColor: "text-amber-400",
  },
  eth: {
    key: "eth",
    label: "Ethereum",
    shortLabel: "ETH",
    chartColor: "#6366f1", // Indigo - optimized for chart visibility
    brandColor: "#627EEA", // Ethereum blue - official brand color
    tailwindColor: "text-indigo-400",
  },
  stablecoin: {
    key: "stablecoin",
    label: "Stablecoins",
    shortLabel: "Stablecoin",
    chartColor: "#10b981", // Green - optimized for chart visibility
    brandColor: "#26A69A", // Teal - common stablecoin color
    tailwindColor: "text-emerald-400",
  },
  altcoin: {
    key: "altcoin",
    label: "Altcoins",
    shortLabel: "Altcoin",
    chartColor: "#ef4444", // Red - optimized for chart visibility
    brandColor: "#AB47BC", // Purple - alternative assets color
    tailwindColor: "text-red-400",
  },
} as const;

/**
 * Legacy Portfolio Colors (DEPRECATED)
 * @deprecated Use ASSET_CATEGORIES instead for new code
 * Kept for backwards compatibility with existing code
 */
export const PORTFOLIO_COLORS = {
  BTC: ASSET_CATEGORIES.btc.brandColor,
  ETH: ASSET_CATEGORIES.eth.brandColor,
  STABLECOIN: ASSET_CATEGORIES.stablecoin.brandColor,
  ALTCOIN: ASSET_CATEGORIES.altcoin.brandColor,
} as const;

/**
 * Chart-specific color map
 * Optimized colors for data visualization
 */
export const CHART_COLORS: Record<AssetCategoryKey, string> = {
  btc: ASSET_CATEGORIES.btc.chartColor,
  eth: ASSET_CATEGORIES.eth.chartColor,
  stablecoin: ASSET_CATEGORIES.stablecoin.chartColor,
  altcoin: ASSET_CATEGORIES.altcoin.chartColor,
} as const;

/**
 * Display labels for asset categories
 */
export const ASSET_LABELS: Record<AssetCategoryKey, string> = {
  btc: ASSET_CATEGORIES.btc.label,
  eth: ASSET_CATEGORIES.eth.label,
  stablecoin: ASSET_CATEGORIES.stablecoin.label,
  altcoin: ASSET_CATEGORIES.altcoin.label,
} as const;

/**
 * Stacking order for allocation charts
 * From bottom to top in visualization
 */
export const ALLOCATION_STACK_ORDER: AssetCategoryKey[] = [
  "altcoin",
  "stablecoin",
  "eth",
  "btc",
] as const;

// Portfolio Display Configuration
export const PORTFOLIO_CONFIG = {
  // Chart configuration
  DEFAULT_PIE_CHART_SIZE: 250,
  DEFAULT_PIE_CHART_STROKE_WIDTH: 8,

  // Display configuration
  CURRENCY_LOCALE: "en-US",
  CURRENCY_CODE: "USD",
  HIDDEN_BALANCE_PLACEHOLDER: "••••••••",
  HIDDEN_NUMBER_PLACEHOLDER: "••••",

  // Animation delays
  ANIMATION_DELAY_STEP: 0.1,
  CATEGORY_ANIMATION_DURATION: 0.3,
} as const;

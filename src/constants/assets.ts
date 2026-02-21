/**
 * Asset color mapping for consistent visualization across components
 */
export const ASSET_COLORS = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  SOL: "#14F195",
  ALT: "#627EEA", // Updated to ETH Blue as generic "Ecosystem" color
  USDC: "#2775CA",
  USDT: "#26A17B",
} as const;

/**
 * Unified 4-category color scheme for allocation bars.
 *
 * This provides a consistent color palette across all allocation visualizations:
 * - Dashboard (PortfolioComposition)
 * - Strategy (AllocationComparison)
 * - Backtesting (BacktestTooltip)
 */
export const UNIFIED_COLORS = {
  /** Bitcoin spot holdings - Bitcoin Orange */
  BTC: "#F7931A",
  /** BTC-USDC LP positions - Vibrant Amber (Yield/Gold) */
  BTC_STABLE: "#F59E0B",
  /** Stablecoins - USDC Blue */
  STABLE: "#2775CA",
  /** Everything else (ETH, alts, ETH-LP) - Ethereum Blue (Ecosystem) */
  ALT: "#627EEA",
} as const;

/**
 * Bar opacity settings for allocation visualizations.
 * High opacity ensures vibrant colors on dark backgrounds.
 */
const BAR_OPACITY = {
  TOP: "E6", // 90% - Top of gradient
  BOTTOM: "BF", // 75% - Bottom of gradient
  BORDER: "4D", // 30% - Subtle border
} as const;

interface BarStyle {
  background: string;
  borderColor: string;
  boxShadow: string;
}

/**
 * Generate inline styles for allocation bar segments.
 * Creates a "glass" effect with vertical gradient and subtle bevel.
 * @param color - Base color hex (e.g., ASSET_COLORS.BTC)
 */
export function getBarStyle(color: string): BarStyle {
  return {
    background: `linear-gradient(180deg, ${color}${BAR_OPACITY.TOP} 0%, ${color}${BAR_OPACITY.BOTTOM} 100%)`,
    borderColor: `${color}${BAR_OPACITY.BORDER}`,
    // Subtle inner highlight for 3D depth
    boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.15)`,
  };
}

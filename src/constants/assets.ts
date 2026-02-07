/**
 * Asset color mapping for consistent visualization across components
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
  /** BTC-USDC LP positions - Amber (blend of BTC orange and stable) */
  BTC_STABLE: "#D97706",
  /** Stablecoins - USDC Blue */
  STABLE: "#2775CA",
  /** Everything else (ETH, alts, ETH-LP) - Neutral Gray */
  ALT: "#6B7280",
} as const;

/**
 * Bar opacity settings for allocation visualizations
 * - BACKGROUND: 40% opacity for bar fill (softer, avoids visual overwhelm)
 * - BORDER: 50% opacity for bar border (subtle definition)
 * - Legend dots use 100% opacity for visibility at small sizes
 */
const BAR_OPACITY = {
  BACKGROUND: "66", // 40% opacity in hex
  BORDER: "80", // 50% opacity in hex
} as const;

/**
 * Generate inline styles for allocation bar segments
 * @param color - Base color hex (e.g., ASSET_COLORS.BTC)
 */
export function getBarStyle(color: string) {
  return {
    backgroundColor: `${color}${BAR_OPACITY.BACKGROUND}`,
    border: `1px solid ${color}${BAR_OPACITY.BORDER}`,
  };
}

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
 * Bar opacity settings for allocation visualizations
 * - BACKGROUND: 40% opacity for bar fill (softer, avoids visual overwhelm)
 * - BORDER: 50% opacity for bar border (subtle definition)
 * - Legend dots use 100% opacity for visibility at small sizes
 */
export const BAR_OPACITY = {
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

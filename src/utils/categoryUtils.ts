/**
 * Utility functions for handling asset categories
 */

export const CATEGORY_COLORS = {
  btc: "#F7931A",
  eth: "#627EEA",
  stablecoins: "#26A69A",
  others: "#9C27B0",
  defi: "#00BCD4",
  altcoin: "#FF9800",
  default: "#757575",
} as const;

/**
 * Get color for a given category
 */
export function getCategoryColor(category: string): string {
  const key = category.toLowerCase() as keyof typeof CATEGORY_COLORS;
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  const nameMap: { [key: string]: string } = {
    btc: "Bitcoin",
    eth: "Ethereum",
    stablecoins: "Stablecoins",
    others: "Others",
    defi: "DeFi",
    altcoin: "Altcoins",
  };
  return nameMap[category.toLowerCase()] || category;
}

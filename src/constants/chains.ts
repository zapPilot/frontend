/**
 * Chain Constants
 *
 * Centralized constants for blockchain chain styling and identification
 */

// Chain color schemes for badges and UI elements
export const CHAIN_COLORS = {
  ethereum: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  arbitrum: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  base: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  polygon: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  optimism: "bg-red-500/20 text-red-400 border-red-500/30",
  frax: "bg-green-500/20 text-green-400 border-green-500/30",
  default: "bg-gray-500/20 text-gray-400 border-gray-500/30",
} as const;

// Chain type for type safety
export type ChainId = keyof typeof CHAIN_COLORS;

/**
 * Get Tailwind color classes for a chain badge
 * @param chainId - Chain identifier (case-insensitive)
 * @returns Tailwind CSS classes for background, text, and border
 */
export function getChainColorClasses(chainId: string): string {
  const normalizedChainId = chainId.toLowerCase() as ChainId;
  return CHAIN_COLORS[normalizedChainId] || CHAIN_COLORS.default;
}

import { SUPPORTED_CHAINS } from "@/config/chains";

/**
 * Formats list of supported chains as human-readable string
 * Used for error messages when unsupported chain is encountered
 */
export function formatSupportedChainsList(): string {
  return SUPPORTED_CHAINS.map(c => `${c.name} (${c.id})`).join(", ");
}

/**
 * Creates unsupported chain error message
 */
export function createUnsupportedChainMessage(chainId: number): string {
  const supportedChainNames = formatSupportedChainsList();
  return `Chain ${chainId} is not supported. Supported chains: ${supportedChainNames}`;
}

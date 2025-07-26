import { getChainBlockExplorer } from "../config/chains";

/**
 * Get the block explorer URL for a transaction hash on a specific chain
 */
export function getTransactionExplorerUrl(
  chainId: number,
  transactionHash: string
): string | null {
  const explorerBaseUrl = getChainBlockExplorer(chainId);

  if (!explorerBaseUrl) {
    return null;
  }

  // Remove trailing slash if present
  const baseUrl = explorerBaseUrl.replace(/\/$/, "");

  return `${baseUrl}/tx/${transactionHash}`;
}

/**
 * Get the block explorer URL for an address on a specific chain
 */
export function getAddressExplorerUrl(
  chainId: number,
  address: string
): string | null {
  const explorerBaseUrl = getChainBlockExplorer(chainId);

  if (!explorerBaseUrl) {
    return null;
  }

  // Remove trailing slash if present
  const baseUrl = explorerBaseUrl.replace(/\/$/, "");

  return `${baseUrl}/address/${address}`;
}

/**
 * Get the block explorer URL for a block on a specific chain
 */
export function getBlockExplorerUrl(
  chainId: number,
  blockNumber: number | string
): string | null {
  const explorerBaseUrl = getChainBlockExplorer(chainId);

  if (!explorerBaseUrl) {
    return null;
  }

  // Remove trailing slash if present
  const baseUrl = explorerBaseUrl.replace(/\/$/, "");

  return `${baseUrl}/block/${blockNumber}`;
}

/**
 * Get the block explorer name for a specific chain
 */
export function getExplorerName(chainId: number): string {
  // Common explorer names for different chains
  switch (chainId) {
    case 1: // Ethereum
      return "Etherscan";
    case 42161: // Arbitrum
      return "Arbiscan";
    case 8453: // Base
      return "Basescan";
    case 10: // Optimism
      return "Optimistic Etherscan";
    case 137: // Polygon
      return "Polygonscan";
    case 56: // BSC
      return "BscScan";
    case 43114: // Avalanche
      return "SnowTrace";
    default:
      return "Block Explorer";
  }
}

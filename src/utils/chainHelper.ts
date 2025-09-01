/**
 * Chain name transformation utilities for DeBank API compatibility
 */

type ChainNameMapping = {
  readonly [key: string]: string;
};

/**
 * Transforms chain names to DeBank-compatible format
 * @param chainName - The chain name to transform
 * @returns The DeBank-compatible chain name
 */
export const transformToDebankChainName = (chainName: string): string => {
  const chainNameToDebankChainName: ChainNameMapping = {
    ethereum: "eth",
    "arbitrum one": "arb",
    bsc: "bsc",
    base: "base",
    "op mainnet": "op",
  } as const;

  return chainNameToDebankChainName[chainName] || chainName;
};

/**
 * Normalizes a chain name by removing common suffixes
 * @param chainName - The chain name to normalize
 * @returns The normalized chain name
 */
export const normalizeChainName = (chainName: string): string => {
  if (!chainName) return "";

  return chainName
    .toLowerCase()
    .replace(" one", "")
    .replace(" mainnet", "")
    .trim();
};

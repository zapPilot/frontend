/**
 * Transforms chain names to DeBank-compatible format
 * @param {string} chainName - The chain name to transform
 * @returns {string} The DeBank-compatible chain name
 */
export const transformToDebankChainName = chainName => {
  const chainNameToDebankChainName = {
    ethereum: "eth",
    "arbitrum one": "arb",
    bsc: "bsc",
    base: "base",
    "op mainnet": "op",
  };
  return chainNameToDebankChainName[chainName] || chainName;
};

/**
 * Normalizes a chain name by removing common suffixes
 * @param {string} chainName - The chain name to normalize
 * @returns {string} The normalized chain name
 */
export const normalizeChainName = chainName => {
  if (!chainName) return "";
  return chainName
    .toLowerCase()
    .replace(" one", "")
    .replace(" mainnet", "")
    .trim();
};

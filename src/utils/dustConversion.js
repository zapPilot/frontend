/**
 * Fetches dust tokens from the backend API
 * @param {string} chainName - The normalized chain name (e.g., 'eth', 'arb', 'bsc')
 * @param {string} accountAddress - User's wallet address
 * @returns {Promise<Array>} Array of filtered and sorted dust tokens
 */
export const getTokens = async (chainName, accountAddress) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/user/${accountAddress}/${chainName}/tokens`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch tokens");
  }
  const data = await response.json();
  const filteredAndSortedTokens = data
    ? data
        .filter(token => token.price > 0)
        .filter(
          token =>
            !token.optimized_symbol.toLowerCase().includes("-") &&
            !token.optimized_symbol.toLowerCase().includes("/") &&
            token.optimized_symbol.toLowerCase() !== "usdc" &&
            token.optimized_symbol.toLowerCase() !== "usdt" &&
            token.optimized_symbol.toLowerCase() !== "eth" &&
            token.optimized_symbol.toLowerCase() !== "alp"
        )
        .filter(token => !token.protocol_id.includes("aave"))
        .filter(token => token.amount * token.price > 0.005)
        .sort((a, b) => b.amount * b.price - a.amount * a.price)
    : [];
  return filteredAndSortedTokens;
};
